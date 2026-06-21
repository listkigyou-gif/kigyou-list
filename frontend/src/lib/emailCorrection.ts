/**
 * Utility to check for common typos in email domains and suggest corrections.
 */
const COMMON_TYPO_MAP: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gamil.co": "gmail.com",
  "gmai.com": "gmail.com",
  "hotamil.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.co.jp",
  "yaho.co.jp": "yahoo.co.jp",
  "outlook.con": "outlook.com"
};

/**
 * Checks if the given email has a common domain typo.
 * Returns the suggested email address, or null if no typo was found.
 */
export function checkEmailTypo(email: string): string | null {
  if (!email || !email.includes("@")) return null;
  
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  
  const username = parts[0];
  const domain = parts[1].toLowerCase().trim();
  
  if (COMMON_TYPO_MAP[domain]) {
    return `${username}@${COMMON_TYPO_MAP[domain]}`;
  }
  return null;
}
