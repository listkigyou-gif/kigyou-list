/**
 * formatRelativeDate
 * Converts an ISO date string (or timestamp) to a human-friendly Japanese
 * relative label for display on search cards and detail pages.
 *
 * Examples:
 *   "今日"  (today)
 *   "3日前" (3 days ago)
 *   "今週"  (this week)
 *   "先月"  (last month)
 *   "2024年5月" (over 3 months ago)
 */
export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'データなし';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'データなし';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 14) return '今週';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays < 60) return '先月';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年以上前`;
}

/**
 * formatJapaneseDate
 * Returns a precise "2025年5月18日" string for use in detail pages and Schema.org.
 */
export function formatJapaneseDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'データなし';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'データなし';

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  });
}

/**
 * formatShortDate
 * Returns "2025/05/18" format — used on search cards and detail page badges.
 */
export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * toISOStringLocal
 * Returns ISO 8601 string for Schema.org dateModified field.
 */
export function toISOStringLocal(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

/**
 * parseUTCDate
 * Safely parses a date string or timestamp in UTC and returns a Date object.
 * Replaces spaces with 'T' and appends 'Z' for raw SQLite datetimes to ensure
 * they are interpreted as UTC, not local time.
 */
export function parseUTCDate(dateStr: string | Date | number | null | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'number') return new Date(dateStr);
  
  let cleaned = String(dateStr).trim();
  
  // If it's raw SQLite format "YYYY-MM-DD HH:MM:SS"
  if (cleaned.includes(' ') && !cleaned.includes('Z') && !cleaned.includes('+') && !cleaned.includes('-' /* timezone offset */)) {
    // E.g. "2026-05-27 03:11:20" -> "2026-05-27T03:11:20Z"
    cleaned = cleaned.replace(' ', 'T') + 'Z';
  } else if (!cleaned.includes('Z') && !cleaned.includes('+') && cleaned.includes('T')) {
    // E.g. "2026-05-27T03:11:20" -> "2026-05-27T03:11:20Z"
    cleaned = cleaned + 'Z';
  }
  
  return new Date(cleaned);
}

/**
 * getTodayJstIsoDate
 * Returns the current calendar date (YYYY-MM-DD) in Asia/Tokyo (JST).
 */
export function getTodayJstIsoDate(nowMs: number = Date.now()): string {
  return new Date(nowMs + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * calculateStatutoryJobExpiry
 * Calculates the statutory HelloWork expiry date (受理日の翌々月末日:
 * last day of the second month after signalDate) in YYYY-MM-DD format.
 */
export function calculateStatutoryJobExpiry(signalDate?: string | null): string | null {
  if (!signalDate) return null;
  const match = String(signalDate).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const monthIndex = parseInt(match[2], 10) - 1;
  if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  const lastDayDate = new Date(Date.UTC(year, monthIndex + 3, 0));
  return lastDayDate.toISOString().split('T')[0];
}

/**
 * resolveActiveJobPostingValidThrough
 * Resolves an ISO-8601 `validThrough` (+09:00) string for Schema.org JobPosting.
 * Returns `null` if the explicit or statutory expiry date is already before today (JST),
 * ensuring expired JobPosting structured data is never emitted.
 */
export function resolveActiveJobPostingValidThrough(
  explicitExpiry?: unknown,
  datePosted?: string | null,
  fallbackDays: number = 60,
  nowMs: number = Date.now()
): string | null {
  const todayJst = getTodayJstIsoDate(nowMs);
  const rawExp = explicitExpiry != null ? String(explicitExpiry).trim() : '';
  const cleanExplicit = /^\d{4}-\d{2}-\d{2}/.test(rawExp) ? rawExp.slice(0, 10) : null;
  const expiryDate =
    cleanExplicit ||
    calculateStatutoryJobExpiry(datePosted) ||
    getTodayJstIsoDate(nowMs + fallbackDays * 24 * 60 * 60 * 1000);

  if (expiryDate < todayJst) {
    return null;
  }
  return `${expiryDate}T23:59:59+09:00`;
}

