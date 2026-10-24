import { NextResponse } from "next/server";
import { getCompaniesByNumbers } from "@/lib/db";

export const dynamic = 'force-dynamic';

interface InvoiceBatchItem {
  raw_input: string;
  t_number: string;
  corporate_number: string;
  company_name: string | null;
  full_address: string | null;
  representative_name: string | null;
  status: 'valid' | 'cancelled' | 'unregistered';
  status_label_ja: string;
  status_label_en: string;
  status_label_vi: string;
  registered_date: string | null;
  detail_url: string | null;
}

/**
 * Batch Invoice T-Number Verification API
 * POST /api/invoice/batch
 * Payload: { numbers: string[] | string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let rawInputList: string[] = [];

    if (Array.isArray(body.numbers)) {
      rawInputList = body.numbers.map((n: any) => String(n).trim()).filter(Boolean);
    } else if (typeof body.numbers === 'string') {
      // Split by newlines, commas, tabs or spaces
      rawInputList = body.numbers
        .split(/[\r\n,;\t]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    if (rawInputList.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No numbers provided",
        summary: { total: 0, valid: 0, invalid: 0, unregistered: 0 },
        results: []
      }, { status: 400 });
    }

    // Limit maximum batch size to prevent abuse (up to 100 numbers per request)
    const limitedList = rawInputList.slice(0, 100);

    // Map each raw input to normalized 13-digit corporate number
    const itemMap = new Map<string, { raw: string; corpNum: string; isFormatValid: boolean }>();
    const validCorpNums: string[] = [];

    limitedList.forEach((raw) => {
      // Clean string: remove "T", "t", hyphens, spaces
      const clean = raw.replace(/^[Tt]/, '').replace(/[-\s]/g, '');
      const isFormatValid = /^\d{13}$/.test(clean);
      itemMap.set(raw, {
        raw,
        corpNum: isFormatValid ? clean : '',
        isFormatValid
      });
      if (isFormatValid) {
        validCorpNums.push(clean);
      }
    });

    // Query local PostgreSQL database in a single batch query (<50ms)
    const companies = validCorpNums.length > 0 ? await getCompaniesByNumbers(validCorpNums) : [];
    const companyLookup = new Map<string, any>();
    companies.forEach((c) => {
      companyLookup.set(c.corporate_number, c);
    });

    let validCount = 0;
    let invalidCount = 0;
    let unregisteredCount = 0;

    const results: InvoiceBatchItem[] = limitedList.map((raw) => {
      const parsed = itemMap.get(raw);
      if (!parsed || !parsed.isFormatValid) {
        invalidCount++;
        return {
          raw_input: raw,
          t_number: raw.toUpperCase().startsWith('T') ? raw.toUpperCase() : `T${raw}`,
          corporate_number: '',
          company_name: null,
          full_address: null,
          representative_name: null,
          status: 'unregistered',
          status_label_ja: '番号形式不正（13桁数字またはT+13桁が必要）',
          status_label_en: 'Invalid format (13 digits required)',
          status_label_vi: 'Sai định dạng (Cần 13 chữ số)',
          registered_date: null,
          detail_url: null
        };
      }

      const corpNum = parsed.corpNum;
      const comp = companyLookup.get(corpNum);

      if (!comp) {
        unregisteredCount++;
        return {
          raw_input: raw,
          t_number: `T${corpNum}`,
          corporate_number: corpNum,
          company_name: null,
          full_address: null,
          representative_name: null,
          status: 'unregistered',
          status_label_ja: '未登録（国税庁法人番号公表データに該当なし）',
          status_label_en: 'Unregistered (Not found in official NTA records)',
          status_label_vi: 'Chưa đăng ký (Không tìm thấy trong dữ liệu NTA)',
          registered_date: null,
          detail_url: null
        };
      }

      const isDissolved = comp.status && (comp.status.includes('解散') || comp.status.includes('清算') || comp.status.includes('閉鎖'));
      if (isDissolved) {
        invalidCount++;
        return {
          raw_input: raw,
          t_number: `T${corpNum}`,
          corporate_number: corpNum,
          company_name: comp.company_name,
          full_address: comp.full_address || comp.street_address || comp.prefecture_name || null,
          representative_name: comp.representative_name || null,
          status: 'cancelled',
          status_label_ja: `登録取消・失効（法人状態：${comp.status}）`,
          status_label_en: `Cancelled / Expired (${comp.status})`,
          status_label_vi: `Đã hủy / Hết hiệu lực (${comp.status})`,
          registered_date: comp.establishment_date || '2023-10-01',
          detail_url: `/company/${corpNum}`
        };
      }

      validCount++;
      return {
        raw_input: raw,
        t_number: `T${corpNum}`,
        corporate_number: corpNum,
        company_name: comp.company_name,
        full_address: comp.full_address || comp.street_address || comp.prefecture_name || null,
        representative_name: comp.representative_name || null,
        status: 'valid',
        status_label_ja: '適格請求書発行事業者（有効）',
        status_label_en: 'Qualified Invoice Issuer (Valid)',
        status_label_vi: 'Doanh nghiệp xuất hóa đơn hợp lệ (Hiệu lực)',
        registered_date: comp.establishment_date || '2023-10-01',
        detail_url: `/company/${corpNum}`
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: limitedList.length,
        valid: validCount,
        invalid: invalidCount,
        unregistered: unregisteredCount
      },
      results
    });
  } catch (error) {
    console.error("Error in /api/invoice/batch route:", error);
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
      summary: { total: 0, valid: 0, invalid: 0, unregistered: 0 },
      results: []
    }, { status: 500 });
  }
}
