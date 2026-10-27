import { getActiveBlacklists, addBlacklistEntry, BlacklistRecord } from "./db";

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
 * Manually invalidate cache when admin adds, auto-ban triggers, or deletes rules
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

function ipToInt(ip: string): number | null {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function matchIpOrCidr(clientIp: string, target: string): boolean {
  const cleanIp = clientIp.trim();
  const cleanTarget = target.trim();

  // 1. Exact match
  if (cleanIp === cleanTarget) return true;

  // 2. Full bitwise CIDR match (e.g. '8.216.49.0/24', '8.0.0.0/8', etc.)
  if (cleanTarget.includes('/')) {
    const [rangeIp, bitsStr] = cleanTarget.split('/');
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;
    if (bits === 0) return true;

    const ipInt = ipToInt(cleanIp);
    const rangeInt = ipToInt(rangeIp);
    if (ipInt === null || rangeInt === null) return false;

    const mask = ((0xFFFFFFFF << (32 - bits)) >>> 0);
    return (ipInt & mask) === (rangeInt & mask);
  }

  // 3. Trailing dot prefix match (e.g. '8.216.49.')
  if (cleanTarget.endsWith('.')) {
    return cleanIp.startsWith(cleanTarget);
  }

  return false;
}

/**
 * Validates if an IP address is blocked by any active rule
 */
export async function verifyClientIp(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "unknown_ip") {
    return { blocked: false };
  }

  const cleanIp = ip.trim();

  // 1. Check in-memory cached dynamic blacklists (with 48h expiration handling)
  const blacklists = await getCachedBlacklists();
  for (const item of blacklists) {
    if (item.type !== "ip") continue;

    if (matchIpOrCidr(cleanIp, item.target)) {
      return { blocked: true, reason: item.reason || "Banned IP (Active Rule)" };
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

/**
 * Automatically ban an IP for a given duration (Default: 48 hours)
 */
export async function autoBanIp(
  ip: string,
  reason: string,
  durationHours: number = 48,
  createdBy: string = "system_guard"
): Promise<boolean> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "unknown_ip") {
    return false;
  }
  const cleanIp = ip.trim();
  try {
    const success = await addBlacklistEntry("ip", cleanIp, reason, durationHours, createdBy);
    if (success) {
      invalidateBlacklistCache();
      console.log(`[Security Guard Auto-Ban] IP: ${cleanIp} banned for ${durationHours}h. Reason: ${reason}`);
    }
    return success;
  } catch (err) {
    console.error(`[Security Guard Auto-Ban] Failed to auto-ban IP ${cleanIp}:`, err);
    return false;
  }
}

/**
 * Automatically ban an email domain permanently
 */
export async function autoBanEmailDomain(
  domain: string,
  reason: string,
  durationHours: number = 0,
  createdBy: string = "system_guard"
): Promise<boolean> {
  if (!domain) return false;
  const cleanDomain = domain.trim().toLowerCase().replace(/^@/, "");
  try {
    const success = await addBlacklistEntry("email_domain", cleanDomain, reason, durationHours, createdBy);
    if (success) {
      invalidateBlacklistCache();
      console.log(`[Security Guard Auto-Ban] Email domain: @${cleanDomain} banned. Reason: ${reason}`);
    }
    return success;
  } catch (err) {
    console.error(`[Security Guard Auto-Ban] Failed to auto-ban domain ${cleanDomain}:`, err);
    return false;
  }
}

// =========================================================================
// REAL-TIME PAYMENT SECURITY: CARD HOPPING & COOLDOWN MONITOR
// =========================================================================

interface PaymentFailureAttempt {
  timestamp: number;
  cardId: string; // card fingerprint or brand_last4
  failureCode?: string;
  declineCode?: string;
  email?: string;
}

// In-memory sliding window: IP -> attempts within 15 minutes
const paymentFailureTracker = new Map<string, PaymentFailureAttempt[]>();

// Cooldown map: email or cardId -> timestamp when cooldown expires
const paymentCooldownTracker = new Map<string, number>();

const SLIDING_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CARD_HOPPING_THRESHOLD = 3; // 3 distinct failed cards = Auto-Ban 48h
const REPEATED_SAME_CARD_THRESHOLD = 5; // 5 failures on same card = 30m cooldown
const COOLDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Record payment failure and analyze for Card Hopping (Card Testing Attack)
 * or repeated mistakes by legitimate customers.
 */
export async function recordPaymentFailure(
  ip: string,
  details: {
    cardId?: string;
    failureCode?: string;
    declineCode?: string;
    email?: string;
  }
): Promise<{
  action: "none" | "card_cooldown" | "auto_ban";
  reason?: string;
  distinctCards: number;
  totalFailures: number;
}> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "unknown_ip") {
    return { action: "none", distinctCards: 0, totalFailures: 0 };
  }

  const cleanIp = ip.trim();
  const now = Date.now();
  const cardId = (details.cardId || "unknown_card").trim();

  // 1. Get existing attempts and clean up attempts older than 15 minutes
  const existing = paymentFailureTracker.get(cleanIp) || [];
  const validAttempts = existing.filter((a) => now - a.timestamp <= SLIDING_WINDOW_MS);

  // 2. Add current failure
  validAttempts.push({
    timestamp: now,
    cardId,
    failureCode: details.failureCode,
    declineCode: details.declineCode,
    email: details.email,
  });
  paymentFailureTracker.set(cleanIp, validAttempts);

  // 3. Collect distinct card identifiers (excluding unknown)
  const distinctCards = new Set(
    validAttempts.map((a) => a.cardId).filter((c) => c !== "unknown_card")
  );
  const totalFailures = validAttempts.length;

  // RULE A: Card Hopping (Fraudulent Card Testing Attack)
  // If 3 or more distinct cards failed on the same IP in 15 minutes -> Immediate 48h Auto-Ban!
  if (distinctCards.size >= CARD_HOPPING_THRESHOLD) {
    const reason = `Auto-ban: Card hopping detected (${distinctCards.size} distinct failed cards in 15m)`;
    console.warn(`[Security Guard] ${reason} on IP: ${cleanIp}. Auto-banning 48h.`);
    await autoBanIp(cleanIp, reason, 48, "system_guard");
    paymentFailureTracker.delete(cleanIp);
    return {
      action: "auto_ban",
      reason,
      distinctCards: distinctCards.size,
      totalFailures,
    };
  }

  // RULE B: Repeated failures on the SAME card (Customer mistake)
  // Check failures in the last 10 minutes for this specific card
  const sameCardFailures = validAttempts.filter(
    (a) => a.cardId === cardId && now - a.timestamp <= 10 * 60 * 1000
  );
  if (sameCardFailures.length >= REPEATED_SAME_CARD_THRESHOLD) {
    const cooldownKey = details.email ? `email:${details.email.toLowerCase()}` : `card:${cardId}`;
    paymentCooldownTracker.set(cooldownKey, now + COOLDOWN_DURATION_MS);
    const reason = `Repeated failures on single card (${sameCardFailures.length} attempts in 10m). Temporary 30m payment cooldown applied.`;
    console.warn(`[Security Guard] ${reason} for ${cooldownKey}`);
    return {
      action: "card_cooldown",
      reason,
      distinctCards: distinctCards.size,
      totalFailures,
    };
  }

  return { action: "none", distinctCards: distinctCards.size, totalFailures };
}

/**
 * Check if a customer email or card is currently under temporary cooldown
 */
export function isPaymentInCooldown(identifier: string): { inCooldown: boolean; remainingMinutes?: number } {
  if (!identifier) return { inCooldown: false };
  const key = identifier.toLowerCase().trim();
  const expireTime =
    paymentCooldownTracker.get(key) ||
    paymentCooldownTracker.get(`email:${key}`) ||
    paymentCooldownTracker.get(`card:${key}`);

  if (!expireTime) return { inCooldown: false };
  const now = Date.now();
  if (now >= expireTime) {
    paymentCooldownTracker.delete(key);
    paymentCooldownTracker.delete(`email:${key}`);
    paymentCooldownTracker.delete(`card:${key}`);
    return { inCooldown: false };
  }
  const remainingMinutes = Math.ceil((expireTime - now) / 60000);
  return { inCooldown: true, remainingMinutes };
}

// =========================================================================
// REAL-TIME DATACENTER / PROXY / VPN CLASSIFICATION
// =========================================================================

const datacenterIpCache = new Map<string, { isDatacenter: boolean; org?: string; timestamp: number }>();
const DATACENTER_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const KNOWN_DATACENTER_KEYWORDS = [
  'datacamp', 'cdnext', 'corenet', 'alibaba', 'aliyun', 'tencent',
  'digitalocean', 'amazon', 'aws', 'ovh', 'hetzner', 'linode',
  'vultr', 'choopa', 'm247', 'hostinger', 'leaseweb', 'cogent',
  'ucloud', 'zenlayer', 'kamatera', 'scaleway', 'contabo'
];

/**
 * Checks whether an IP address belongs to a Datacenter, Hosting, or Proxy network.
 * Uses 24h in-memory cache and 1.2s timeout. Never blocks if the lookup fails or times out.
 */
export async function isDatacenterIp(ip: string): Promise<{ isDatacenter: boolean; org?: string }> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "unknown_ip") {
    return { isDatacenter: false };
  }
  const cleanIp = ip.trim();

  // 1. Check in-memory cache
  const cached = datacenterIpCache.get(cleanIp);
  if (cached && Date.now() - cached.timestamp < DATACENTER_CACHE_TTL_MS) {
    return { isDatacenter: cached.isDatacenter, org: cached.org };
  }

  // 2. Query ASN & Hosting status via IP intelligence API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,hosting,proxy,org,as,isp`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const orgInfo = `${data.org || ''} ${data.as || ''} ${data.isp || ''}`.toLowerCase();
        const matchesKeyword = KNOWN_DATACENTER_KEYWORDS.some(kw => orgInfo.includes(kw));
        const isDc = Boolean(data.hosting || data.proxy || matchesKeyword);

        datacenterIpCache.set(cleanIp, { 
          isDatacenter: isDc, 
          org: data.org || data.as || (isDc ? "Datacenter/Hosting" : undefined), 
          timestamp: Date.now() 
        });
        return { isDatacenter: isDc, org: data.org || data.as };
      }
    }
  } catch (err) {
    // Fail-safe: do not block legitimate users if external lookup times out
  }

  return { isDatacenter: false };
}

