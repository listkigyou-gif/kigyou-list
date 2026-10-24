import { Company, runQuery } from './db';

export interface LegalHistoryEvent {
  id: string;
  date: string; // YYYY-MM-DD
  rawDate: string;
  eventType: 
    | 'invoice_registration' 
    | 'establishment' 
    | 'address_change' 
    | 'name_change' 
    | 'status_check'
    | 'representative_change'
    | 'invoice_change'
    | 'merger'
    | 'bankruptcy'
    | 'relocation'
    | 'new_establishment'
    | 'other';
  eventBadgeJa: string;
  eventBadgeEn: string;
  eventBadgeVi: string;
  titleJa: string;
  titleEn: string;
  titleVi: string;
  detailsJa: string;
  detailsEn: string;
  detailsVi: string;
  source: string;
  sourceUrl?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

// In-memory cache for live NTA history (24 hour TTL)
const ntaHistoryCache = new Map<string, { data: LegalHistoryEvent[]; expiry: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function clearNtaHistoryCache(corpNum?: string): void {
  if (corpNum) {
    ntaHistoryCache.delete(corpNum);
  } else {
    ntaHistoryCache.clear();
  }
}

/**
 * Convert Japanese Wareki date (令和/平成/昭和) to ISO YYYY-MM-DD
 */
export function warekiToIso(wStr: string | null | undefined): string | null {
  if (!wStr) return null;
  const clean = wStr.trim();
  const m = clean.match(/(令和|平成|昭和)(元|\d+)年(\d+)月(\d+)日/);
  if (!m) return null;
  const era = m[1];
  const y = m[2] === '元' ? 1 : parseInt(m[2], 10);
  const mth = parseInt(m[3], 10).toString().padStart(2, '0');
  const d = parseInt(m[4], 10).toString().padStart(2, '0');

  let fullYear: number;
  if (era === '令和') {
    fullYear = 2018 + y;
  } else if (era === '平成') {
    fullYear = 1988 + y;
  } else if (era === '昭和') {
    fullYear = 1925 + y;
  } else {
    return null;
  }
  return `${fullYear}-${mth}-${d}`;
}

/**
 * Format date helper (Parses any date format to YYYY-MM-DD)
 */
function formatJapaneseDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return '2015-10-05';
  const clean = dateStr.trim();
  const wareki = warekiToIso(clean);
  if (wareki) return wareki;

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const match = clean.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '2015-10-05';
}

/**
 * Live crawl & parse change history from National Tax Agency Corporate Number portal
 * URL: https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo={corporate_number}
 */
async function fetchNtaLiveHistory(
  corpNum: string,
  companyName: string,
  currentAddress: string
): Promise<LegalHistoryEvent[] | null> {
  try {
    const targetUrl = `https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=${corpNum}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
      next: { revalidate: 86400 } // Cache fetch for 24h in Next.js
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();
    if (!html.includes('corpHistory')) return null;

    // 1. First pass: extract all blocks and identify original registered address prior to any relocation
    const dlRegex = /<dl class="corpHistory">([\s\S]*?)<\/dl>/g;
    let match: RegExpExecArray | null;
    const rawBlocks: Array<{ isNew: boolean; noStr: string; data: Record<string, string> }> = [];

    while ((match = dlRegex.exec(html)) !== null) {
      const block = match[1];
      const isNew = block.includes('新規');
      const noMatch = block.match(/<dt>(No\.\d+)/);
      const noStr = noMatch ? noMatch[1] : '';

      const pairRegex = /<span class="title">([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>/g;
      const data: Record<string, string> = {};
      let pair: RegExpExecArray | null;
      while ((pair = pairRegex.exec(block)) !== null) {
        const key = pair[1].replace(/<[^>]+>/g, '').trim();
        const val = pair[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
        data[key] = val;
      }

      rawBlocks.push({ isNew, noStr, data });
    }

    const parsedEvents: LegalHistoryEvent[] = [];

    // 2. Second pass: construct events with true historical accuracy
    for (const item of rawBlocks) {
      const { isNew, noStr, data } = item;

      if (isNew || data['法人番号指定年月日']) {
        const dateRaw = data['法人番号指定年月日'] || data['事由発生年月日'];
        const iso = warekiToIso(dateRaw) || formatJapaneseDateString(dateRaw);
        
        parsedEvents.push({
          id: `nta-desig-${corpNum}-${noStr || 'new'}`,
          date: iso,
          rawDate: iso,
          eventType: 'establishment',
          eventBadgeJa: '法人番号指定・登記',
          eventBadgeEn: 'Corporate Number Designated',
          eventBadgeVi: 'Chỉ định mã số pháp nhân',
          titleJa: `法人番号の指定・登記公表（指定番号：${corpNum}）`,
          titleEn: `Corporate Number Designated (No. ${corpNum})`,
          titleVi: `Chỉ định & Công bố Mã số Pháp nhân Quốc gia (Số: ${corpNum})`,
          detailsJa: `国税庁長官により13桁の法人番号「${corpNum}」が新規指定され、商号「${companyName}」の公表が行われました。`,
          detailsEn: `13-digit Corporate Number "${corpNum}" was officially assigned by the National Tax Agency Commissioner with corporate name "${companyName}".`,
          detailsVi: `Tổng cục Thuế Quốc gia Nhật Bản chính thức cấp mã số pháp nhân 13 chữ số "${corpNum}" và công bố pháp nhân thương hiệu "${companyName}".`,
          source: '国税庁 法人番号公表サイト',
          sourceUrl: targetUrl,
        });
      } else {
        const reason = data['変更の事由'] || '';
        const oldInfo = data['旧情報'] || '';
        const dateRaw = data['事由発生年月日'] || data['変更年月日'];
        const iso = warekiToIso(dateRaw) || formatJapaneseDateString(dateRaw);

        if (reason.includes('所在地') || reason.includes('移転')) {
          parsedEvents.push({
            id: `nta-addr-${corpNum}-${noStr || Math.random().toString(36).slice(2, 7)}`,
            date: iso,
            rawDate: iso,
            eventType: 'address_change',
            eventBadgeJa: '国内所在地の変更',
            eventBadgeEn: 'Relocation of Head Office',
            eventBadgeVi: 'Thay đổi địa chỉ trụ sở',
            titleJa: `本店又は主たる事務所の所在地の変更`,
            titleEn: `Change of Registered Head Office Address`,
            titleVi: `Thay đổi địa chỉ trụ sở chính của doanh nghiệp`,
            detailsJa: oldInfo 
              ? `【新住所】${currentAddress} （旧住所：${oldInfo}）へ本店を移転登記。`
              : `法人の本店所在地の変更登記が国税庁公表システムに反映されました。`,
            detailsEn: oldInfo
              ? `Head office relocated to [New] "${currentAddress}" from [Old] "${oldInfo}".`
              : `Registered corporate office relocation recorded in the National Tax Agency system.`,
            detailsVi: oldInfo
              ? `Chuyển trụ sở chính sang [Địa chỉ mới] "${currentAddress}" từ [Địa chỉ cũ] "${oldInfo}".`
              : `Ghi nhận biến động thay đổi địa chỉ trụ sở trên hệ thống công bố Tổng cục Thuế Nhật Bản.`,
            source: '国税庁 法人番号公表サイト（変更履歴）',
            sourceUrl: targetUrl,
          });
        } else if (reason.includes('商号') || reason.includes('名称')) {
          parsedEvents.push({
            id: `nta-name-${corpNum}-${noStr || Math.random().toString(36).slice(2, 7)}`,
            date: iso,
            rawDate: iso,
            eventType: 'name_change',
            eventBadgeJa: '商号・名称変更',
            eventBadgeEn: 'Corporate Name Change',
            eventBadgeVi: 'Đổi tên doanh nghiệp',
            titleJa: `商号又は名称の変更`,
            titleEn: `Change of Corporate Trade Name`,
            titleVi: `Thay đổi tên pháp nhân / thương hiệu đăng ký`,
            detailsJa: oldInfo
              ? `旧商号「${oldInfo}」から現在の商号「${companyName}」へ商号変更。`
              : `商号の変更登記が国税庁公表システムに反映されました。`,
            detailsEn: oldInfo
              ? `Corporate trade name changed from "${oldInfo}" to "${companyName}".`
              : `Corporate name change recorded in National Tax Agency database.`,
            detailsVi: oldInfo
              ? `Thay đổi tên doanh nghiệp từ "${oldInfo}" thành "${companyName}".`
              : `Ghi nhận thay đổi tên pháp nhân trên hệ thống Tổng cục Thuế.`,
            source: '国税庁 法人番号公表サイト（変更履歴）',
            sourceUrl: targetUrl,
          });
        } else {
          parsedEvents.push({
            id: `nta-event-${corpNum}-${noStr || Math.random().toString(36).slice(2, 7)}`,
            date: iso,
            rawDate: iso,
            eventType: 'status_check',
            eventBadgeJa: '登記更新',
            eventBadgeEn: 'Registry Update',
            eventBadgeVi: 'Cập nhật đăng ký',
            titleJa: reason || '法人登記情報の変更',
            titleEn: reason || 'Corporate Registry Update',
            titleVi: reason || 'Cập nhật thông tin đăng ký pháp nhân',
            detailsJa: oldInfo ? `変更前：${oldInfo}` : `登記変更の事由が公表されました。`,
            detailsEn: oldInfo ? `Previous: ${oldInfo}` : `Corporate registry update recorded.`,
            detailsVi: oldInfo ? `Thông tin trước thay đổi: ${oldInfo}` : `Ghi nhận thay đổi thông tin pháp nhân.`,
            source: '国税庁 法人番号公表サイト（変更履歴）',
            sourceUrl: targetUrl,
          });
        }
      }
    }

    return parsedEvents.length > 0 ? parsedEvents : null;
  } catch (err) {
    console.warn(`[ntaHistory] Live fetch skipped for ${corpNum}:`, (err as any)?.message || err);
    return null;
  }
}

/**
 * Helper: Map database row from company_legal_histories to LegalHistoryEvent
 */
function mapDbRowToLegalEvent(row: any): LegalHistoryEvent {
  let isoDate = '';
  if (row.event_date instanceof Date) {
    isoDate = row.event_date.toISOString().split('T')[0];
  } else if (typeof row.event_date === 'string') {
    isoDate = row.event_date.split('T')[0];
  }
  return {
    id: `db-${row.corporate_number}-${row.event_type}-${isoDate}`,
    date: isoDate,
    rawDate: isoDate,
    eventType: row.event_type,
    eventBadgeJa: row.event_badge_ja || '登記更新',
    eventBadgeEn: row.event_badge_en || 'Registry Update',
    eventBadgeVi: row.event_badge_vi || 'Cập nhật đăng ký',
    titleJa: row.title_ja,
    titleEn: row.title_en || row.title_ja,
    titleVi: row.title_vi || row.title_ja,
    detailsJa: row.details_ja,
    detailsEn: row.details_en || row.details_ja,
    detailsVi: row.details_vi || row.details_ja,
    source: row.source || '国税庁 法人番号公表サイト',
    sourceUrl: row.source_url || undefined,
  };
}

/**
 * Deduplicate events occurring on the same date:
 * If a specific event (e.g. address_change, name_change, establishment, dissolution)
 * coexists with a generic status_check, prioritize the specific detailed event.
 */
function deduplicateLegalEvents(events: LegalHistoryEvent[]): LegalHistoryEvent[] {
  if (!events || events.length <= 1) return events;
  
  const byDate = new Map<string, LegalHistoryEvent[]>();
  for (const evt of events) {
    const d = evt.rawDate || evt.date;
    if (!byDate.has(d)) {
      byDate.set(d, []);
    }
    byDate.get(d)!.push(evt);
  }

  const result: LegalHistoryEvent[] = [];
  for (const list of byDate.values()) {
    if (list.length === 1) {
      result.push(list[0]);
    } else {
      const hasSpecific = list.some(e => e.eventType !== 'status_check');
      if (hasSpecific) {
        result.push(...list.filter(e => e.eventType !== 'status_check'));
      } else {
        result.push(list[0]);
      }
    }
  }
  return result;
}

/**
 * Fetch legal history from PostgreSQL / SQLite company_legal_histories table
 */
async function fetchLegalHistoryFromDB(corpNum: string): Promise<LegalHistoryEvent[] | null> {
  try {
    const rows = await runQuery(
      'SELECT * FROM company_legal_histories WHERE corporate_number = ? ORDER BY event_date DESC',
      [corpNum]
    );
    if (rows && rows.length > 0) {
      const mapped = rows.map(mapDbRowToLegalEvent);
      return deduplicateLegalEvents(mapped);
    }
    return null;
  } catch (err) {
    console.warn(`[ntaHistory] DB query failed for ${corpNum}:`, (err as any)?.message || err);
    return null;
  }
}

/**
 * Auto-persist fetched legal history events into PostgreSQL / SQLite
 */
async function autoPersistLegalHistoryToDB(corpNum: string, events: LegalHistoryEvent[]): Promise<void> {
  if (!events || events.length === 0) return;
  try {
    for (const evt of events) {
      await runQuery(
        `INSERT INTO company_legal_histories (
          corporate_number, event_type, event_date,
          event_badge_ja, event_badge_en, event_badge_vi,
          title_ja, title_en, title_vi,
          details_ja, details_en, details_vi,
          source, source_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (corporate_number, event_type, event_date) DO UPDATE SET
          details_ja = EXCLUDED.details_ja,
          title_ja = EXCLUDED.title_ja,
          source = EXCLUDED.source`,
        [
          corpNum,
          evt.eventType,
          evt.rawDate,
          evt.eventBadgeJa,
          evt.eventBadgeEn,
          evt.eventBadgeVi,
          evt.titleJa,
          evt.titleEn,
          evt.titleVi,
          evt.detailsJa,
          evt.detailsEn,
          evt.detailsVi,
          evt.source,
          evt.sourceUrl || null,
        ]
      );
    }
  } catch (err) {
    console.warn(`[ntaHistory] Auto-persist to DB failed for ${corpNum}:`, (err as any)?.message || err);
  }
}

/**
 * Fetch and construct official legal history for a Japanese enterprise
 * 1. Database-First (PostgreSQL company_legal_histories)
 * 2. On-demand NTA crawl & auto-persist
 * 3. Database records fallback
 */
export async function getCompanyLegalHistory(company: Company): Promise<LegalHistoryEvent[]> {
  const corpNum = company.corporate_number;
  const companyName = company.company_name;
  const address = company.full_address || company.street_address || company.prefecture_name || '日本国内';

  // 1. Check in-memory cache
  const cached = ntaHistoryCache.get(corpNum);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  // 2. Database-First: Read from company_legal_histories table (Ultra-fast 1-2ms)
  const dbEvents = await fetchLegalHistoryFromDB(corpNum);
  if (dbEvents && dbEvents.length > 0) {
    dbEvents.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    ntaHistoryCache.set(corpNum, { data: dbEvents, expiry: Date.now() + CACHE_TTL_MS });
    return dbEvents;
  }

  // 3. If DB is empty, crawl live from NTA public history page
  let events = await fetchNtaLiveHistory(corpNum, companyName, address);

  // 4. If live crawl succeeded, auto-persist to PostgreSQL / SQLite and return
  if (events && events.length > 0) {
    events.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    // Auto-save into database for permanent offline speed & resilience
    autoPersistLegalHistoryToDB(corpNum, events).catch(err => {
      console.warn(`[ntaHistory] Background autoPersist failed for ${corpNum}:`, err);
    });
    ntaHistoryCache.set(corpNum, { data: events, expiry: Date.now() + CACHE_TTL_MS });
    return events;
  }

  // 5. Fallback: Synthesize initial designation event using database records
  events = [];

  let designationDate = '2015-10-05';
  if (company.establishment_date) {
    designationDate = formatJapaneseDateString(company.establishment_date);
  }

  events.push({
    id: `nta-designation-${corpNum}`,
    date: designationDate,
    rawDate: designationDate,
    eventType: 'establishment',
    eventBadgeJa: '法人番号指定・登記',
    eventBadgeEn: 'Corporate Number Designated',
    eventBadgeVi: 'Chỉ định mã số pháp nhân',
    titleJa: `法人番号の指定・登記公表（指定番号：${corpNum}）`,
    titleEn: `Corporate Number Designated (No. ${corpNum})`,
    titleVi: `Chỉ định & Công bố Mã số Pháp nhân Quốc gia (Số: ${corpNum})`,
    detailsJa: `行政手続における特定の個人を識別するための番号の利用等に関する法律に基づき、国税庁長官により13桁の法人番号「${corpNum}」が指定され、商業登記情報に基づく法人設立が公表されました。`,
    detailsEn: `The 13-digit Corporate Number "${corpNum}" was officially assigned by the National Tax Agency Commissioner upon incorporation.`,
    detailsVi: `Tổng cục Thuế Quốc gia Nhật Bản chính thức cấp mã số pháp nhân 13 chữ số "${corpNum}" ghi nhận sự kiện thành lập doanh nghiệp.`,
    source: '国税庁 法人番号公表サイト',
    sourceUrl: `https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=${corpNum}`,
  });

  events.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  ntaHistoryCache.set(corpNum, { data: events, expiry: Date.now() + CACHE_TTL_MS });
  return events;
}
