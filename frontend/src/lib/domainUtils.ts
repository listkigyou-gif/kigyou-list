// Utility for domain extraction and company email domain matching (B2B Standard)

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.co.jp",
  "yahoo.com",
  "ybb.ne.jp",
  "outlook.com",
  "outlook.jp",
  "hotmail.com",
  "hotmail.co.jp",
  "live.com",
  "live.jp",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "zoho.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
]);

/**
 * Extracts a clean domain from an email address or a website URL.
 * e.g. "https://www.synergy-career.co.jp/about" -> "synergy-career.co.jp"
 * e.g. "tanaka@synergy-career.co.jp" -> "synergy-career.co.jp"
 */
export function extractCleanDomain(urlOrEmail: string | null | undefined): string {
  if (!urlOrEmail) return "";
  let val = urlOrEmail.trim().toLowerCase();
  if (val.includes("@")) {
    val = val.split("@")[1] || "";
  } else {
    // Strip protocol
    val = val.replace(/^https?:\/\//i, "");
    // Strip path, query params, ports
    val = val.split("/")[0].split("?")[0].split(":")[0];
    // Strip www. prefix
    val = val.replace(/^www\./i, "");
  }
  return val.trim();
}

/**
 * Checks if the given email belongs to a public/free email provider.
 */
export function isFreeEmailDomain(email: string | null | undefined): boolean {
  const domain = extractCleanDomain(email);
  return FREE_EMAIL_DOMAINS.has(domain);
}

/**
 * Validates whether an email domain matches the company's official website domain.
 */
export function isDomainMatch(
  email: string | null | undefined,
  websiteUrl: string | null | undefined
): boolean {
  if (!email || !websiteUrl) return false;
  const emailDomain = extractCleanDomain(email);
  if (!emailDomain || FREE_EMAIL_DOMAINS.has(emailDomain)) return false;

  const siteDomain = extractCleanDomain(websiteUrl);
  if (!siteDomain) return false;

  // Exact match
  if (emailDomain === siteDomain) return true;

  // Subdomain match (e.g. recruit.synergy-career.co.jp matches synergy-career.co.jp)
  if (emailDomain.endsWith("." + siteDomain) || siteDomain.endsWith("." + emailDomain)) {
    return true;
  }

  return false;
}
