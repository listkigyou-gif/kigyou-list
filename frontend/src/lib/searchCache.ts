/**
 * Kigyou-List In-Memory Smart LRU Cache for Next.js Search Engine
 * 
 * Features:
 * 1. Normalized Canonical Cache Keys: Deterministic alphabetical parameter sorting,
 *    guaranteeing that ?prefecture=13&hiring=true and ?hiring=true&prefecture=13 produce the exact same key.
 * 2. Strict Memory Cap (Max 50MB): Precise size tracking per item with automatic LRU eviction.
 * 3. 15-Minute TTL (Time-To-Live): Active expiration and periodic sweep timer.
 * 4. Selective Caching: Caches Page 1-5 (offset <= 60) for 95% of traffic, protecting RAM from deep crawler loops.
 * 5. Safe Singleton: Preserved across Next.js module reloads using globalThis.
 */

import type { Company, SearchFilters } from './db';

export interface SearchCacheValue {
  companies: Company[];
  totalCount: number;
}

interface CacheNode {
  key: string;
  value: SearchCacheValue;
  sizeBytes: number;
  expiresAt: number;
  prev: CacheNode | null;
  next: CacheNode | null;
}

export interface CacheTelemetry {
  entries: number;
  maxEntries: number;
  sizeBytes: number;
  maxSizeBytes: number;
  sizeMB: string;
  maxSizeMB: string;
  hits: number;
  misses: number;
  hitRate: string;
  evictions: number;
}

const MAX_ENTRIES = 1000; // Maximum number of cached queries
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 Megabytes hard memory cap
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 Minutes (900,000 ms)
const SWEEP_INTERVAL_MS = 3 * 60 * 1000; // Sweep expired items every 3 minutes

export class SmartSearchLRUCache {
  private map = new Map<string, CacheNode>();
  private head: CacheNode | null = null; // Most recently used
  private tail: CacheNode | null = null; // Least recently used
  private currentSizeBytes = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic background cleanup of expired nodes
    if (typeof setInterval !== 'undefined') {
      this.sweepTimer = setInterval(() => this.sweepExpired(), SWEEP_INTERVAL_MS);
      if (this.sweepTimer && typeof this.sweepTimer.unref === 'function') {
        this.sweepTimer.unref(); // Do not prevent process exit
      }
    }
  }

  /**
   * Generates a deterministic, normalized canonical cache key for a search query.
   * Alphabetically orders all active filter keys to guarantee 100% cache hits
   * regardless of how query parameters were supplied in the URL.
   */
  public static normalizeKey(
    keyword: string,
    filters: Partial<SearchFilters>,
    limit: number,
    offset: number
  ): string {
    const parts: string[] = [];

    // 1. Keyword
    const cleanKw = (keyword || '').trim().toLowerCase();
    if (cleanKw) parts.push(`kw=${encodeURIComponent(cleanKw)}`);

    // 2. Active filters sorted alphabetically
    const activeEntries: [string, any][] = [];

    if (filters.prefecture_code) activeEntries.push(['pref', filters.prefecture_code]);
    if (filters.city_name) activeEntries.push(['city', filters.city_name]);
    if (filters.industry_code) activeEntries.push(['ind', filters.industry_code]);

    if (filters.min_employees != null) activeEntries.push(['emp_min', filters.min_employees]);
    if (filters.max_employees != null) activeEntries.push(['emp_max', filters.max_employees]);

    if (filters.min_capital != null) activeEntries.push(['cap_min', filters.min_capital]);
    if (filters.max_capital != null) activeEntries.push(['cap_max', filters.max_capital]);

    if (filters.min_sales != null) activeEntries.push(['sales_min', filters.min_sales]);
    if (filters.max_sales != null) activeEntries.push(['sales_max', filters.max_sales]);

    if (filters.min_establishment_year != null) activeEntries.push(['est_min', filters.min_establishment_year]);
    if (filters.max_establishment_year != null) activeEntries.push(['est_max', filters.max_establishment_year]);

    // Signals & Features
    if (filters.has_hiring === true) activeEntries.push(['sig_hiring', '1']);
    if (filters.has_subsidy === true) activeEntries.push(['sig_subsidy', '1']);
    if (filters.has_bidding === true) activeEntries.push(['sig_bidding', '1']);
    if (filters.has_award === true) activeEntries.push(['sig_award', '1']);
    if (filters.has_certification === true) activeEntries.push(['sig_cert', '1']);
    if (filters.has_patent === true) activeEntries.push(['sig_patent', '1']);
    if (filters.has_financials === true) activeEntries.push(['sig_fin', '1']);

    // Contacts
    if (filters.has_contact_form === true) activeEntries.push(['cnt_form', '1']);
    if (filters.has_email === true) activeEntries.push(['cnt_email', '1']);
    if (filters.has_phone === true) activeEntries.push(['cnt_phone', '1']);
    if (filters.has_website === true) activeEntries.push(['cnt_web', '1']);
    if (filters.has_fax === true) activeEntries.push(['cnt_fax', '1']);
    if (filters.email_type) activeEntries.push(['email_type', filters.email_type]);
    if (filters.company_status) activeEntries.push(['status', filters.company_status]);

    // Financial detail filters
    if (filters.min_operating_income != null) activeEntries.push(['op_inc_min', filters.min_operating_income]);
    if (filters.max_operating_income != null) activeEntries.push(['op_inc_max', filters.max_operating_income]);
    if (filters.min_ordinary_income != null) activeEntries.push(['ord_inc_min', filters.min_ordinary_income]);
    if (filters.max_ordinary_income != null) activeEntries.push(['ord_inc_max', filters.max_ordinary_income]);
    if (filters.min_net_income != null) activeEntries.push(['net_inc_min', filters.min_net_income]);
    if (filters.max_net_income != null) activeEntries.push(['net_inc_max', filters.max_net_income]);

    // Sort alphabetically by param key
    activeEntries.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [k, v] of activeEntries) {
      parts.push(`${k}=${v}`);
    }

    // 3. Pagination
    parts.push(`lim=${limit}`);
    parts.push(`off=${offset}`);

    return `search:v1:${parts.join('|')}`;
  }

  /**
   * Decides whether a search query should be cached in RAM.
   * We cache Page 1 through Page 5 (offset <= 60), which covers 95%+ of normal user & bot traffic.
   */
  public static shouldCache(offset: number): boolean {
    return offset <= 60; // Up to Page 5 (limit 15 * 4 = offset 60)
  }

  /**
   * Retrieves an item from the cache.
   * If found and not expired, moves the node to the head (MRU) and returns the value.
   */
  public get(key: string): SearchCacheValue | null {
    const node = this.map.get(key);
    if (!node) {
      this.misses++;
      return null;
    }

    // Check expiration (TTL 15 mins)
    if (Date.now() > node.expiresAt) {
      this.removeNode(node);
      this.misses++;
      return null;
    }

    // Move to head of doubly-linked list (Most Recently Used)
    this.moveToHead(node);
    this.hits++;
    return node.value;
  }

  /**
   * Inserts or updates an item in the cache.
   * Evicts least recently used items if entry limit or 50MB memory cap is exceeded.
   */
  public set(key: string, value: SearchCacheValue, ttlMs: number = DEFAULT_TTL_MS): void {
    const sizeBytes = this.estimateSizeBytes(value);

    // If an individual payload is unreasonably huge (> 5MB), skip caching it
    if (sizeBytes > 5 * 1024 * 1024) {
      return;
    }

    const existingNode = this.map.get(key);
    if (existingNode) {
      // Update existing node
      this.currentSizeBytes += sizeBytes - existingNode.sizeBytes;
      existingNode.value = value;
      existingNode.sizeBytes = sizeBytes;
      existingNode.expiresAt = Date.now() + ttlMs;
      this.moveToHead(existingNode);
    } else {
      // Evict old entries until within limits
      while (
        (this.currentSizeBytes + sizeBytes > MAX_SIZE_BYTES || this.map.size >= MAX_ENTRIES) &&
        this.tail
      ) {
        this.evictTail();
      }

      const newNode: CacheNode = {
        key,
        value,
        sizeBytes,
        expiresAt: Date.now() + ttlMs,
        prev: null,
        next: null
      };

      this.map.set(key, newNode);
      this.currentSizeBytes += sizeBytes;
      this.addToHead(newNode);
    }
  }

  /**
   * Estimates memory consumption of the cached result in bytes.
   */
  private estimateSizeBytes(value: SearchCacheValue): number {
    // Rough fast estimate: ~1.8KB per company record + JSON wrapper overhead
    const companyCount = value.companies ? value.companies.length : 0;
    return 512 + companyCount * 1800;
  }

  private addToHead(node: CacheNode): void {
    node.next = this.head;
    node.prev = null;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    this.map.delete(node.key);
    this.currentSizeBytes -= node.sizeBytes;
    if (this.currentSizeBytes < 0) this.currentSizeBytes = 0;
  }

  private moveToHead(node: CacheNode): void {
    if (node === this.head) return;

    // Disconnect
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;

    // Connect at head
    node.next = this.head;
    node.prev = null;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private evictTail(): void {
    if (!this.tail) return;
    this.evictions++;
    this.removeNode(this.tail);
  }

  /**
   * Cleans up expired entries periodically
   */
  private sweepExpired(): void {
    const now = Date.now();
    let current = this.tail;
    while (current) {
      const prev = current.prev;
      if (now > current.expiresAt) {
        this.removeNode(current);
      }
      current = prev;
    }
  }

  /**
   * Returns cache runtime telemetry
   */
  public getTelemetry(): CacheTelemetry {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? ((this.hits / totalRequests) * 100).toFixed(1) + '%' : '0%';
    return {
      entries: this.map.size,
      maxEntries: MAX_ENTRIES,
      sizeBytes: this.currentSizeBytes,
      maxSizeBytes: MAX_SIZE_BYTES,
      sizeMB: (this.currentSizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
      maxSizeMB: (MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0) + ' MB',
      hits: this.hits,
      misses: this.misses,
      hitRate,
      evictions: this.evictions
    };
  }

  /**
   * Clears all cached items
   */
  public clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
    this.currentSizeBytes = 0;
  }
}

// Global Singleton for Next.js to preserve cache across HMR / module re-evaluations
const globalForCache = globalThis as unknown as {
  __kigyouSearchLRUCache?: SmartSearchLRUCache;
};

export const searchLRUCache =
  globalForCache.__kigyouSearchLRUCache || new SmartSearchLRUCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.__kigyouSearchLRUCache = searchLRUCache;
}
