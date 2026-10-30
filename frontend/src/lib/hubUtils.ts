/**
 * Dynamic Hubs Utility & Mapping Helper
 * Standards compliant with Japanese B2B Programmatic SEO Architecture
 */

export interface PrefectureMeta {
  code: string;
  slug: string;
  nameJa: string;
  nameEn: string;
}

export const PREFECTURES: PrefectureMeta[] = [
  { code: '01', slug: 'hokkaido', nameJa: '北海道', nameEn: 'Hokkaido' },
  { code: '02', slug: 'aomori', nameJa: '青森県', nameEn: 'Aomori' },
  { code: '03', slug: 'iwate', nameJa: '岩手県', nameEn: 'Iwate' },
  { code: '04', slug: 'miyagi', nameJa: '宮城県', nameEn: 'Miyagi' },
  { code: '05', slug: 'akita', nameJa: '秋田県', nameEn: 'Akita' },
  { code: '06', slug: 'yamagata', nameJa: '山形県', nameEn: 'Yamagata' },
  { code: '07', slug: 'fukushima', nameJa: '福島県', nameEn: 'Fukushima' },
  { code: '08', slug: 'ibaraki', nameJa: '茨城県', nameEn: 'Ibaraki' },
  { code: '09', slug: 'tochigi', nameJa: '栃木県', nameEn: 'Tochigi' },
  { code: '10', slug: 'gunma', nameJa: '群馬県', nameEn: 'Gunma' },
  { code: '11', slug: 'saitama', nameJa: '埼玉県', nameEn: 'Saitama' },
  { code: '12', slug: 'chiba', nameJa: '千葉県', nameEn: 'Chiba' },
  { code: '13', slug: 'tokyo', nameJa: '東京都', nameEn: 'Tokyo' },
  { code: '14', slug: 'kanagawa', nameJa: '神奈川県', nameEn: 'Kanagawa' },
  { code: '15', slug: 'niigata', nameJa: '新潟県', nameEn: 'Niigata' },
  { code: '16', slug: 'toyama', nameJa: '富山県', nameEn: 'Toyama' },
  { code: '17', slug: 'ishikawa', nameJa: '石川県', nameEn: 'Ishikawa' },
  { code: '18', slug: 'fukui', nameJa: '福井県', nameEn: 'Fukui' },
  { code: '19', slug: 'yamanashi', nameJa: '山梨県', nameEn: 'Yamanashi' },
  { code: '20', slug: 'nagano', nameJa: '長野県', nameEn: 'Nagano' },
  { code: '21', slug: 'gifu', nameJa: '岐阜県', nameEn: 'Gifu' },
  { code: '22', slug: 'shizuoka', nameJa: '静岡県', nameEn: 'Shizuoka' },
  { code: '23', slug: 'aichi', nameJa: '愛知県', nameEn: 'Aichi' },
  { code: '24', slug: 'mie', nameJa: '三重県', nameEn: 'Mie' },
  { code: '25', slug: 'shiga', nameJa: '滋賀県', nameEn: 'Shiga' },
  { code: '26', slug: 'kyoto', nameJa: '京都府', nameEn: 'Kyoto' },
  { code: '27', slug: 'osaka', nameJa: '大阪府', nameEn: 'Osaka' },
  { code: '28', slug: 'hyogo', nameJa: '兵庫県', nameEn: 'Hyogo' },
  { code: '29', slug: 'nara', nameJa: '奈良県', nameEn: 'Nara' },
  { code: '30', slug: 'wakayama', nameJa: '和歌山県', nameEn: 'Wakayama' },
  { code: '31', slug: 'tottori', nameJa: '鳥取県', nameEn: 'Tottori' },
  { code: '32', slug: 'shimane', nameJa: '島根県', nameEn: 'Shimane' },
  { code: '33', slug: 'okayama', nameJa: '岡山県', nameEn: 'Okayama' },
  { code: '34', slug: 'hiroshima', nameJa: '広島県', nameEn: 'Hiroshima' },
  { code: '35', slug: 'yamaguchi', nameJa: '山口県', nameEn: 'Yamaguchi' },
  { code: '36', slug: 'tokushima', nameJa: '徳島県', nameEn: 'Tokushima' },
  { code: '37', slug: 'kagawa', nameJa: '香川県', nameEn: 'Kagawa' },
  { code: '38', slug: 'ehime', nameJa: '愛媛県', nameEn: 'Ehime' },
  { code: '39', slug: 'kochi', nameJa: '高知県', nameEn: 'Kochi' },
  { code: '40', slug: 'fukuoka', nameJa: '福岡県', nameEn: 'Fukuoka' },
  { code: '41', slug: 'saga', nameJa: '佐賀県', nameEn: 'Saga' },
  { code: '42', slug: 'nagasaki', nameJa: '長崎県', nameEn: 'Nagasaki' },
  { code: '43', slug: 'kumamoto', nameJa: '熊本県', nameEn: 'Kumamoto' },
  { code: '44', slug: 'oita', nameJa: '大分県', nameEn: 'Oita' },
  { code: '45', slug: 'miyazaki', nameJa: '宮崎県', nameEn: 'Miyazaki' },
  { code: '46', slug: 'kagoshima', nameJa: '鹿児島県', nameEn: 'Kagoshima' },
  { code: '47', slug: 'okinawa', nameJa: '沖縄県', nameEn: 'Okinawa' },
];

const slugMap = new Map<string, PrefectureMeta>();
const codeMap = new Map<string, PrefectureMeta>();
const nameJaMap = new Map<string, PrefectureMeta>();

for (const p of PREFECTURES) {
  slugMap.set(p.slug.toLowerCase(), p);
  codeMap.set(p.code, p);
  nameJaMap.set(p.nameJa, p);
  // Also support name without '県' / '府' / '都'
  const shortName = p.nameJa.replace(/[都府県]$/, '');
  nameJaMap.set(shortName, p);
}

/**
 * Resolves any prefecture representation (slug, code, name) into standardized PrefectureMeta.
 */
export function resolvePrefecture(param?: string | null): PrefectureMeta | null {
  if (!param) return null;
  const clean = param.trim().toLowerCase();
  
  // By code (e.g. "13", "01")
  if (/^\d{1,2}$/.test(clean)) {
    const padded = clean.padStart(2, '0');
    return codeMap.get(padded) || null;
  }
  
  // By slug (e.g. "tokyo", "osaka")
  if (slugMap.has(clean)) {
    return slugMap.get(clean)!;
  }

  // By Japanese name
  if (nameJaMap.has(param.trim())) {
    return nameJaMap.get(param.trim())!;
  }

  return null;
}

/**
 * Checks if a string matches a YearMonth format (YYYY-MM or YYYY).
 */
export function parseYearMonthSlug(param?: string | null): string | null {
  if (!param) return null;
  const clean = param.trim();
  if (/^\d{4}-\d{2}$/.test(clean)) {
    return clean;
  }
  if (/^\d{4}$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Resolves optional slug array into structured parameters for Hub routes.
 * e.g. ["tokyo"] -> { pref: Tokyo, yearMonth: null }
 * e.g. ["tokyo", "2026-10"] -> { pref: Tokyo, yearMonth: "2026-10" }
 * e.g. ["2026-10"] -> { pref: null, yearMonth: "2026-10" }
 */
export function parseHubSlug(slugs?: string[]): {
  prefecture: PrefectureMeta | null;
  yearMonth: string | null;
} {
  if (!slugs || slugs.length === 0) {
    return { prefecture: null, yearMonth: null };
  }

  let prefecture: PrefectureMeta | null = null;
  let yearMonth: string | null = null;

  for (const part of slugs) {
    if (!prefecture) {
      const resolvedPref = resolvePrefecture(part);
      if (resolvedPref) {
        prefecture = resolvedPref;
        continue;
      }
    }

    if (!yearMonth) {
      const resolvedYm = parseYearMonthSlug(part);
      if (resolvedYm) {
        yearMonth = resolvedYm;
        continue;
      }
    }
  }

  return { prefecture, yearMonth };
}

/**
 * Returns localized name for a prefecture (or 'Nationwide' / 'Toàn quốc' / '全国' if null).
 */
export function getPrefectureLabel(p: PrefectureMeta | null, locale: string): string {
  if (!p) {
    return locale === 'ja' ? '全国' : locale === 'vi' ? 'Toàn quốc' : 'Nationwide';
  }
  if (locale === 'ja') return p.nameJa;
  if (locale === 'vi') return p.nameEn;
  return p.nameEn;
}
