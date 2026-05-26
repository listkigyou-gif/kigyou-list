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
