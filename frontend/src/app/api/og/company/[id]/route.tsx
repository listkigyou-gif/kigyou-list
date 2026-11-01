import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';
import { getCompanyByNumber, getCompanyIndustries } from '@/lib/db';

export const runtime = 'nodejs';

let fontDataCache: ArrayBuffer | null = null;

function getFontData(): ArrayBuffer | null {
  if (fontDataCache) return fontDataCache;
  try {
    const fontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSansJP-Bold.ttf');
    if (fs.existsSync(fontPath)) {
      const buffer = fs.readFileSync(fontPath);
      fontDataCache = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      return fontDataCache;
    }
    const pubPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Bold.ttf');
    if (fs.existsSync(pubPath)) {
      const buffer = fs.readFileSync(pubPath);
      fontDataCache = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      return fontDataCache;
    }
  } catch (err) {
    console.error('Failed to load local Japanese font:', err);
  }
  return null;
}

function formatCapital(val: number | null | undefined): string {
  if (!val || isNaN(val)) return '非公開';
  let num = val;
  if (num > 10_000_000_000_000) {
    num = num / 100_000;
  }
  if (num >= 100_000_000) {
    return `${(num / 100_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`;
  }
  if (num >= 10_000) {
    return `${(num / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`;
  }
  return `¥${num.toLocaleString('ja-JP')}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const companyId = resolvedParams.id;

    if (!companyId || !/^\d{13}$/.test(companyId)) {
      return new Response('Invalid Corporate Number', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ja';

    const [company, industries] = await Promise.all([
      getCompanyByNumber(companyId),
      getCompanyIndustries(companyId),
    ]);

    if (!company) {
      return new Response('Company not found', { status: 404 });
    }

    const companyName =
      locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
    const kana = company.company_name_kana ? `（${company.company_name_kana}）` : '';
    const fullAddress =
      company.full_address ||
      `${company.prefecture_name || ''}${company.city_name || ''}${company.street_address || ''}`;
    const primaryIndustry = industries[0]?.industry_name || company.jigyo_shumoku || '一般法人';

    const hasInvoice = Boolean(company.has_invoice);
    const isListed = Boolean(
      company.is_listed || (company.listing_market && company.listing_market !== '非上場')
    );

    // Metrics
    const capitalStr = formatCapital(company.capital_amount);
    const empCount = company.insured_employee_count || company.employee_count;
    const empStr = empCount ? `${empCount.toLocaleString('ja-JP')} 名` : '登記・調査中';
    
    let metric3Label = '設立年月';
    let metric3Value = company.establishment_date ? `${company.establishment_date.slice(0, 4)}年` : '登記済';
    if (company.avg_annual_salary) {
      metric3Label = '平均年収';
      metric3Value = `${company.avg_annual_salary} 万円`;
    }

    const fontData = getFontData();
    const fonts = fontData
      ? [
          {
            name: 'NotoSansJP',
            data: fontData,
            style: 'normal' as const,
            weight: 700 as const,
          },
        ]
      : [];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#091528',
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(30, 58, 138, 0.45) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(14, 116, 144, 0.35) 0%, transparent 45%)',
            padding: '48px 56px',
            fontFamily: fontData ? 'NotoSansJP, sans-serif' : 'sans-serif',
            color: '#ffffff',
          }}
        >
          {/* Top Bar: Brand & Corporate Tax ID */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  marginRight: '14px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff' }}>K</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Kigyou-list
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '0.04em' }}>
                  日本全国500万社 企業データベース
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 18px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#94a3b8', marginRight: '8px' }}>
                国税庁 法人番号:
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#67e8f9',
                  letterSpacing: '0.06em',
                }}
              >
                {companyId}
              </span>
            </div>
          </div>

          {/* Main Card: Company Profile */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '36px 42px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Badges Row */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  marginRight: '12px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                  {primaryIndustry}
                </span>
              </div>

              {hasInvoice && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    marginRight: '12px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 700 }}>
                    ✓ インボイス適格事業者
                  </span>
                </div>
              )}

              {isListed && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    marginRight: '12px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 700 }}>
                    ★ 上場企業
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '4px 12px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  {company.prefecture_name || '日本国内法人'}
                </span>
              </div>
            </div>

            {/* Company Name */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: companyName.length > 20 ? '42px' : '52px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  lineHeight: 1.15,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {companyName}
              </div>
              {kana && (
                <div style={{ fontSize: '16px', color: '#94a3b8', marginTop: '6px' }}>
                  {kana}
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#38bdf8', marginRight: '8px' }}>📍</span>
              <span style={{ fontSize: '16px', color: '#cbd5e1' }}>
                {fullAddress || '本社所在地 登記情報あり'}
              </span>
            </div>
          </div>

          {/* 4 Metric Boxes */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginRight: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                資本金
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
                {capitalStr}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginRight: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                従業員・被保険者
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
                {empStr}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginRight: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                {metric3Label}
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
                {metric3Value}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                法人ステータス
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>
                国税庁 登記法人
              </span>
            </div>
          </div>

          {/* Bottom Bar: Canonical URL & Copyright */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '16px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#67e8f9', letterSpacing: '0.02em' }}>
              https://kigyoulist.com/{locale}/company/{companyId}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              © Kigyou-list | 国内最大級の法人信用調査プラットフォーム
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
