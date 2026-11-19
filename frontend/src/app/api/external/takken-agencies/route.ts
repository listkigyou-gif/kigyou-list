import { NextResponse } from 'next/server';
import { runQuery, getCompaniesByNumbers } from '@/lib/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

const PREF_MAP: Record<string, string> = {
  '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
  '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
  '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
  '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
  '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
  '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
  '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
  '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
  '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
  '鹿児島県': '46', '沖縄県': '47'
};

const CODE_TO_PREF = Object.fromEntries(
  Object.entries(PREF_MAP).map(([k, v]) => [v, k])
);

const REGION_TO_CODES: Record<string, string[]> = {
  '関東': ['13', '14', '11', '12', '08', '09', '10'],
  '関西': ['27', '28', '26', '25', '29', '30'],
  '東海・中部': ['23', '22', '21', '24', '15', '20', '19', '16', '17', '18'],
  '九州・沖縄': ['40', '41', '42', '43', '44', '45', '46', '47'],
  '北海道・東北': ['01', '02', '03', '04', '05', '06', '07'],
  '中国・四国': ['34', '33', '35', '31', '32', '37', '38', '36', '39'],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 1. If action=counts, return all 47 prefecture breakdown
    if (action === 'counts') {
      const countRows = await runQuery(`
        SELECT prefecture_code, count(*) as count
        FROM company_licenses
        WHERE license_type = '宅地建物取引業'
          AND prefecture_code IS NOT NULL
        GROUP BY prefecture_code
        ORDER BY count DESC
      `);

      const counts = countRows.map((r: any) => ({
        prefecture: CODE_TO_PREF[r.prefecture_code] || r.prefecture_code,
        count: parseInt(r.count, 10),
      }));

      return NextResponse.json({
        success: true,
        counts,
        total: counts.reduce((acc, c) => acc + c.count, 0),
      }, {
        headers: CORS_HEADERS,
      });
    }

    const rawPref = searchParams.get('prefecture')?.trim() || '';
    const regionParam = searchParams.get('region')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';
    const keyword = searchParams.get('keyword')?.trim() || searchParams.get('query')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const offset = (page - 1) * limit;

    // Resolve prefecture codes
    let prefCodes: string[] = [];
    if (regionParam && REGION_TO_CODES[regionParam]) {
      prefCodes = REGION_TO_CODES[regionParam];
    } else if (rawPref && rawPref !== '全国' && rawPref !== 'ALL') {
      if (REGION_TO_CODES[rawPref]) {
        prefCodes = REGION_TO_CODES[rawPref];
      } else {
        const parts = rawPref.split(',').map(p => p.trim()).filter(Boolean);
        parts.forEach(part => {
          if (/^\d{1,2}$/.test(part)) {
            prefCodes.push(part.padStart(2, '0'));
          } else {
            const normalized = part.endsWith('都') || part.endsWith('府') || part.endsWith('県')
              ? part
              : part + (part === '東京' ? '都' : (part === '大阪' || part === '京都' ? '府' : '県'));
            const c = PREF_MAP[normalized] || PREF_MAP[part];
            if (c) prefCodes.push(c);
          }
        });
      }
    }

    // Build conditions for company_licenses (table size is ~26,000 rows for takken)
    const conditions: string[] = ["license_type = '宅地建物取引業'"];
    const params: any[] = [];

    if (prefCodes.length === 1) {
      params.push(prefCodes[0]);
      conditions.push(`prefecture_code = $${params.length}`);
    } else if (prefCodes.length > 1) {
      params.push(prefCodes);
      conditions.push(`prefecture_code = ANY($${params.length})`);
    }

    if (city) {
      params.push(`%${city}%`);
      conditions.push(`registered_address LIKE $${params.length}`);
    }

    if (keyword) {
      params.push(`%${keyword}%`);
      const pIdx = params.length;
      conditions.push(`(
        corporate_number = $${pIdx} 
        OR license_number ILIKE $${pIdx} 
        OR registered_address ILIKE $${pIdx}
        OR representative_name ILIKE $${pIdx}
      )`);
    }

    const whereClause = conditions.join(' AND ');

    // 1. Count query
    const countSql = `SELECT count(*) as total FROM company_licenses WHERE ${whereClause}`;
    const countRows = await runQuery(countSql, params);
    const totalCount = parseInt(countRows[0]?.total || '0', 10);

    // 2. Fetch paginated licenses
    const licSql = `
      SELECT 
        id,
        corporate_number,
        license_number,
        license_category,
        issuing_authority,
        prefecture_code,
        representative_name,
        office_phone,
        office_fax,
        registered_address,
        issue_date,
        license_status,
        specialties_json
      FROM company_licenses
      WHERE ${whereClause}
      ORDER BY id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const licRows = await runQuery(licSql, params);

    // 3. Enrich with company data (batch query by corporate_number via indexed PK)
    const corpNumbers = licRows.map((r: any) => r.corporate_number).filter(Boolean);
    let compMap = new Map<string, any>();

    if (corpNumbers.length > 0) {
      const compRows = await getCompaniesByNumbers(corpNumbers);
      compRows.forEach((c: any) => {
        compMap.set(c.corporate_number, c);
      });
    }

    // 4. Assemble final agency payload
    const agencies = licRows.map((lic: any) => {
      const comp = compMap.get(lic.corporate_number) || {};
      const prefName = CODE_TO_PREF[lic.prefecture_code] || comp.prefecture_name || '';
      const address = lic.registered_address || comp.full_address || '';
      const phone = lic.office_phone || comp.phone_number || null;
      
      let parsedSpecialties: string[] = ['宅建免許保有'];
      if (lic.is_claimed && lic.specialties_json) {
        try {
          const specObj = JSON.parse(lic.specialties_json);
          if (Array.isArray(specObj) && specObj.length > 0) {
            parsedSpecialties = Array.from(new Set(['宅建免許保有', ...specObj]));
          }
        } catch {}
      }

      return {
        id: `kigyou_${lic.corporate_number || lic.id}`,
        corporateNumber: lic.corporate_number,
        houjinNumber: lic.corporate_number,
        companyName: comp.company_name || (lic.representative_name ? `${lic.representative_name}（個人・不動産業）` : '宅建免許保有企業'),
        companyNameKana: comp.company_name_kana || null,
        licenseNumber: lic.license_number || '宅地建物取引業者免許',
        licenseCategory: lic.license_category || '知事免許',
        issuingAuthority: lic.issuing_authority || prefName,
        licenseStatus: lic.license_status || '有効',
        prefecture: prefName,
        city: comp.city_name || '',
        address: address,
        postalCode: comp.postal_code || null,
        phone: phone,
        fax: lic.office_fax || comp.fax_number || null,
        website: comp.website_url || null,
        representativeName: lic.representative_name || comp.representative_name || null,
        specialties: parsedSpecialties,
        isClaimed: false,
        isVerified: false, // unverified by default so owner verification button is shown
        status: 'ACTIVE',
        kigyoulistUrl: lic.corporate_number ? `https://kigyoulist.com/ja/company/${lic.corporate_number}` : null,
        source: 'kigyoulist.com'
      };
    });

    return NextResponse.json({
      success: true,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      agencies,
    }, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error: any) {
    console.error('Error in /api/external/takken-agencies:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
    }, {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
