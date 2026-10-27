import { isIpBlocked } from "./db";

// Hardcoded blacklist of high-risk fraud CIDRs / IPs for instant Edge rejection
const HARDCODED_BLOCKED_IPS = [
  "8.216.49.100",
];

const BLOCKED_IP_PREFIXES = [
  "8.216.49.", // Alibaba Cloud transit / datacenter proxy used in carding attacks
];

// Fraudulent / Disposable email domain patterns
const DISPOSABLE_EMAIL_PATTERNS = [
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
 * Validates if an IP address is blocked
 */
export async function verifyClientIp(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return { blocked: false };
  }

  // 1. Check hardcoded exact IPs
  if (HARDCODED_BLOCKED_IPS.includes(ip)) {
    return { blocked: true, reason: "Carding fraud IP" };
  }

  // 2. Check prefix / CIDR
  for (const prefix of BLOCKED_IP_PREFIXES) {
    if (ip.startsWith(prefix)) {
      return { blocked: true, reason: "High-risk datacenter proxy range" };
    }
  }

  // 3. Check DB blocked_ips table
  try {
    const isDbBlocked = await isIpBlocked(ip);
    if (isDbBlocked) {
      return { blocked: true, reason: "Database blocked IP" };
    }
  } catch (err) {
    console.error("Error checking isIpBlocked in verifyClientIp:", err);
  }

  return { blocked: false };
}

/**
 * Validates if an email is suspicious or from a disposable/fraud domain
 */
export function isSuspiciousEmail(email: string): boolean {
  if (!email || typeof email !== "string") return true;
  const normalized = email.trim().toLowerCase();

  for (const pattern of DISPOSABLE_EMAIL_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}
