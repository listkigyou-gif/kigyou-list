import { getActiveBlacklists, BlacklistRecord } from "./db";

// In-Memory Cache for ultra-fast (sub-millisecond) Edge & Route checks
interface BlacklistCache {
  items: BlacklistRecord[];
  timestamp: number;
}

let cache: BlacklistCache | null = null;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Fetch active blacklists using cache
 */
async function getCachedBlacklists(): Promise<BlacklistRecord[]> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.items;
  }

  try {
    const items = await getActiveBlacklists();
    cache = { items, timestamp: now };
    return items;
  } catch (err) {
    console.error("[Security Guard] Failed to load active blacklists:", err);
    return cache ? cache.items : [];
  }
}

/**
 * Manually invalidate cache when admin adds or deletes rules
 */
export function invalidateBlacklistCache() {
  cache = null;
}

// Built-in high-risk disposable email patterns
const BUILTIN_DISPOSABLE_PATTERNS = [
  /@.*gmai+l+d+\.com$/i, // catches gmaiilllld.com, gmailld.com, etc.
  /@.*mailinator\.com$/i,
  /@.*tempmail\./i,
  /@.*guerrillamail\./i,
  /@.*10minutemail\./i,
  /@.*throwawaymail\./i,
  /@.*yopmail\./i,
  /@.*trashmail\./i,
  /@.*sharklasers\.com$/i,
  /@.*dispostable\.com$/i,
];

/**
 * Validates if an IP address is blocked by any active rule
 */
export async function verifyClientIp(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return { blocked: false };
  }

  const cleanIp = ip.trim();

  // 1. Check in-memory cached dynamic blacklists (with 48h expiration handling)
  const blacklists = await getCachedBlacklists();
  for (const item of blacklists) {
    if (item.type !== "ip") continue;

    const target = item.target.trim();

    // Exact match
    if (cleanIp === target) {
      return { blocked: true, reason: item.reason || "Banned IP (Active Rule)" };
    }

    // CIDR / Prefix match (e.g. '8.216.49.0/24' or '8.216.49.')
    if (target.endsWith("/24")) {
      const prefix = target.replace(/\.0\/24$/, "");
      if (cleanIp.startsWith(prefix + ".")) {
        return { blocked: true, reason: item.reason || "Banned Subnet (/24)" };
      }
    } else if (target.endsWith(".")) {
      if (cleanIp.startsWith(target)) {
        return { blocked: true, reason: item.reason || "Banned IP Range" };
      }
    }
  }

  return { blocked: false };
}

/**
 * Validates if an email is suspicious or belongs to an active blacklisted domain
 */
export async function verifyClientEmail(email: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!email || typeof email !== "string") {
    return { blocked: true, reason: "Invalid email" };
  }

  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] || "";

  // 1. Check dynamic blacklisted domains from DB (cached)
  const blacklists = await getCachedBlacklists();
  for (const item of blacklists) {
    if (item.type === "email_domain") {
      const targetDomain = item.target.trim().toLowerCase();
      if (domain === targetDomain || domain.endsWith("." + targetDomain)) {
        return { blocked: true, reason: item.reason || "Blacklisted Email Domain" };
      }
    } else if (item.type === "email") {
      if (normalized === item.target.trim().toLowerCase()) {
        return { blocked: true, reason: item.reason || "Blacklisted Email" };
      }
    }
  }

  // 2. Check built-in disposable patterns
  for (const pattern of BUILTIN_DISPOSABLE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: "Disposable/Fraudulent Email Pattern" };
    }
  }

  return { blocked: false };
}

/**
 * Synchronous quick check for known built-in patterns
 */
export function isSuspiciousEmail(email: string): boolean {
  if (!email || typeof email !== "string") return true;
  const normalized = email.trim().toLowerCase();
  return BUILTIN_DISPOSABLE_PATTERNS.some((p) => p.test(normalized));
}
