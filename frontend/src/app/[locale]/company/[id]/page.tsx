import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Building2, MapPin, Phone, Globe, Mail, Printer, Calendar, 
  Briefcase, FileText, ChevronRight, BarChart3, Clock, Share2, ShieldCheck, MessageSquare, ArrowRight, HelpCircle, Search, Newspaper, History, Award, ExternalLink, CheckCircle2
} from 'lucide-react';
import { formatShortDate, toISOStringLocal } from '@/lib/dateUtils';
import { 
  getCompanyByNumber, getCompanyFinancials, 
  getCompanySignals, getRelatedCompanies, getCompanyIndustries,
  getCompanyLicenses, getRecentHubEventsForCompany, BusinessSignal
} from '@/lib/db';
import { getCompanyLegalHistory, LegalHistoryEvent } from '@/lib/ntaHistory';
import { Header } from '@/components/Header';
import { ObfuscatedPhone } from '@/components/ObfuscatedPhone';
import { CompanyActions } from '@/components/CompanyActions';
import { CompanyPRSection } from '@/components/CompanyPRSection';
import { CompanyCorrectionBar } from '@/components/CompanyCorrectionBar';
import { UnlockCTA } from '@/components/UnlockCTA';
import { Footer } from '@/components/Footer';
import { CompanyFinancials } from '@/components/CompanyFinancials';
import { CompanySignalsTimeline } from '@/components/CompanySignalsTimeline';
import { CompanyLegalHistoryTimeline } from '@/components/company/CompanyLegalHistoryTimeline';
import { CompanyLicensesSection } from '@/components/company/CompanyLicensesSection';
import { CompanyHubBacklinks } from '@/components/company/CompanyHubBacklinks';
import { CopyTextButton } from '@/components/CopyTextButton';

import { getTranslations } from '@/lib/i18n';
import { CompanyLogo } from '@/components/CompanyLogo';
import { translatePosition, formatEnglishDate, getPrefectureName, getIndustryName } from '@/lib/locale-mapping';
import { CompanyConversionBar } from '@/components/CompanyConversionBar';

export const revalidate = 600; // Cache profiles for 10 minutes, ISR enabled

function formatJapaneseDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[0]}年${parts[1]}月${parts[2]}日`;
  }
  if (/^\d{4}$/.test(dateStr)) {
    return `${dateStr}年`;
  }
  return dateStr;
}

function formatVietnameseDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatJapaneseCurrency(amount: number | string | null | undefined, locale: string, isCapital: boolean = false): string {
  if (amount === null || amount === undefined || amount === "") return "";
  let num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "";
  
  // Normalize ingested data error where certain records were multiplied by 100,000 (e.g. 796兆円 instead of 79.6億円)
  if (num > 10_000_000_000_000 && isCapital) {
    num = num / 100_000;
  }

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const sign = isNeg ? "-" : "";

  if (locale === 'en') {
    if (abs >= 1_000_000_000_000) return `${sign}¥${(abs / 1_000_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}T JPY`;
    if (abs >= 1_000_000_000) return `${sign}¥${(abs / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B JPY`;
    if (abs >= 1_000_000) return `${sign}¥${(abs / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M JPY`;
    return `${sign}¥${abs.toLocaleString('en-US')} JPY`;
  }
  if (locale === 'vi') {
    if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} nghìn tỷ JPY`;
    if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} trăm triệu JPY`;
    if (abs >= 10_000) return `${sign}${(abs / 10_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} vạn JPY`;
    return `${sign}¥${abs.toLocaleString('vi-VN')} JPY`;
  }
  // Japanese
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}兆円`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`;
  }
  return `${sign}¥${abs.toLocaleString('ja-JP')}`;
}

function formatCompactCurrency(val: number | null | undefined, locale: string): string {
  if (val === null || val === undefined || val === 0) return '—';
  const isNeg = val < 0;
  const abs = Math.abs(val);
  const sign = isNeg ? '-' : '';

  if (locale === 'en') {
    if (abs >= 1_000_000_000_000) return `${sign}¥${(abs / 1_000_000_000_000).toFixed(1)}T`;
    if (abs >= 1_000_000_000) return `${sign}¥${(abs / 1_000_000_000).toFixed(1)}B`;
    return `${sign}¥${(abs / 1_000_000).toFixed(0)}M`;
  }
  // JA & VI compact table representation
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toFixed(1)}兆円`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(0)}億円`;
  }
  return `${sign}${(abs / 10_000).toFixed(0)}万円`;
}

function cleanDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname !== '/' ? parsed.pathname : '';
    return `${parsed.hostname}${path}`.replace(/\/$/, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

function cleanRepresentativeName(rawName: string | null): string {
  if (!rawName) return '';
  const trimmed = rawName.replace(/[\s\u00A0\u3000]+/g, ' ').trim();
  // In Japanese registries, names often have arbitrary spaces between each kanji (e.g. 亀 澤  宏 規)
  // If it's a Japanese name (Kanji / Kana / spaces), remove internal spacing for natural Japanese representation
  if (/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
}

function generateDynamicSummary(
  company: any,
  locale: string,
  industryName: string | null,
  prefectureName: string | null,
  isOnPage: boolean = false
): string {
  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const fullAddress = company.full_address || 
    `${company.prefecture_name || ''}${company.city_name || ''}${company.street_address || ''}`;
  const repClean = cleanRepresentativeName(company.representative_name);
  const repPos = company.representative_position ? cleanRepresentativeName(company.representative_position) : '';
  const invoiceNumber = `T${company.corporate_number}`;

  const isListed = Boolean(company.is_listed || (company.listing_market && company.listing_market !== '非上場'));
  const empCount = typeof company.employee_count === 'number' ? company.employee_count : null;
  const capAmount = typeof company.capital_amount === 'number' ? company.capital_amount : null;

  if (locale === 'en') {
    const scaleLabel = isListed ? 'major listed enterprise' : (empCount && empCount >= 300) ? 'large corporation' : (empCount && empCount >= 50) ? 'mid-sized company' : 'corporation';
    const industryLabel = industryName ? ` operating in the ${industryName} sector` : '';

    if (isOnPage) {
      let s1 = `${companyName} (Corporate ID: ${company.corporate_number}) is a ${scaleLabel}${industryLabel}${fullAddress ? ` headquartered in ${fullAddress}` : ''}.`;
      let s2 = '';
      if (repClean) s2 += `Led by ${repPos || 'Representative'} ${repClean}. `;
      if (company.establishment_date) s2 += `Officially registered in Japan on ${formatEnglishDate(company.establishment_date)}. `;

      const kpisEn: string[] = [];
      if (company.sales_amount) kpisEn.push(`annual revenue: ${formatJapaneseCurrency(company.sales_amount, 'en')}`);
      if (company.ordinary_income) kpisEn.push(`ordinary profit: ${formatJapaneseCurrency(company.ordinary_income, 'en')}`);
      if (company.employee_count) kpisEn.push(`workforce: ${company.employee_count.toLocaleString('en-US')} employees`);
      if (company.capital_amount) kpisEn.push(`capital: ${formatJapaneseCurrency(company.capital_amount, 'en', true)}`);
      const s3 = kpisEn.length > 0 ? `Latest operational metrics report ${kpisEn.join(', ')}. ` : '';

      const s4 = `Fully registered under Japan's National Tax Agency Qualified Invoice System (Invoice No: ${invoiceNumber}). Official contact (${company.phone_number || 'verified listing'}), corporate governance, and multi-year financial statements are openly accessible on Kigyou-list.`;

      return `${s1} ${s2}${s3}${s4}`.replace(/\s+/g, ' ').trim();
    }

    const currentYear = new Date().getFullYear();
    const metaKpisEn: string[] = [];
    if (company.sales_amount) metaKpisEn.push(`Revenue: ${formatJapaneseCurrency(company.sales_amount, 'en')}`);
    if (company.employee_count) metaKpisEn.push(`Employees: ${company.employee_count.toLocaleString('en-US')}`);
    if (company.phone_number) metaKpisEn.push(`Phone: ${company.phone_number}`);
    const kpiStrEn = metaKpisEn.length > 0 ? `. ${metaKpisEn.join(', ')}` : '';

    return `${companyName} (${prefectureName || 'Japan'}) - ${currentYear} Corporate Profile, Tax ID: ${company.corporate_number}, Invoice: ${invoiceNumber}${kpiStrEn}. Verified executive records & B2B intelligence on Kigyou-list.`;

  } else if (locale === 'vi') {
    const scaleLabel = isListed ? 'tập đoàn lớn niêm yết' : (empCount && empCount >= 300) ? 'doanh nghiệp quy mô lớn' : (empCount && empCount >= 50) ? 'doanh nghiệp quy mô vừa' : 'doanh nghiệp vừa và nhỏ';
    const industryLabel = industryName ? ` hoạt động trong lĩnh vực ${industryName}` : '';

    if (isOnPage) {
      let s1 = `${companyName} (Mã số pháp nhân: ${company.corporate_number}) là ${scaleLabel}${industryLabel}${fullAddress ? ` có trụ sở chính tại ${fullAddress}` : ''}.`;
      let s2 = '';
      if (repClean) s2 += `Người đại diện là ${repPos || 'Đại diện pháp luật'} ${repClean}. `;
      if (company.establishment_date) s2 += `Được chỉ định mã số thuế tại Nhật Bản vào ngày ${formatVietnameseDate(company.establishment_date)}. `;

      const kpisVi: string[] = [];
      if (company.sales_amount) kpisVi.push(`doanh thu: ${formatJapaneseCurrency(company.sales_amount, 'vi')}`);
      if (company.ordinary_income) kpisVi.push(`lợi nhuận thường niên: ${formatJapaneseCurrency(company.ordinary_income, 'vi')}`);
      if (company.employee_count) kpisVi.push(`quy mô: ${company.employee_count.toLocaleString('vi-VN')} nhân sự`);
      if (company.capital_amount) kpisVi.push(`vốn điều lệ: ${formatJapaneseCurrency(company.capital_amount, 'vi', true)}`);
      const s3 = kpisVi.length > 0 ? `Các chỉ số tài chính gần nhất ghi nhận ${kpisVi.join(', ')}. ` : '';

      const s4 = `Doanh nghiệp đã đăng ký chứng nhận Hóa đơn hợp lệ theo Luật Invoice Quốc thuế Nhật Bản (Mã Invoice: ${invoiceNumber}). Số điện thoại liên hệ (${company.phone_number || 'đã xác minh'}), hồ sơ pháp lý và lịch sử tài chính được công khai miễn phí trên Kigyou-list.`;

      return `${s1} ${s2}${s3}${s4}`.replace(/\s+/g, ' ').trim();
    }

    const currentYear = new Date().getFullYear();
    const metaKpisVi: string[] = [];
    if (company.sales_amount) metaKpisVi.push(`Doanh thu: ${formatJapaneseCurrency(company.sales_amount, 'vi')}`);
    if (company.employee_count) metaKpisVi.push(`Nhân sự: ${company.employee_count.toLocaleString('vi-VN')}`);
    if (company.phone_number) metaKpisVi.push(`SĐT: ${company.phone_number}`);
    const kpiStrVi = metaKpisVi.length > 0 ? `. ${metaKpisVi.join(', ')}` : '';

    return `【${currentYear}】${companyName} (${prefectureName || 'Nhật Bản'}) - Hồ sơ doanh nghiệp, mã pháp nhân ${company.corporate_number}, Invoice: ${invoiceNumber}${kpiStrVi}. Tra cứu báo cáo tài chính & dữ liệu đối tác tại Kigyou-list.`;

  } else {
    // Japanese locale (ja) - High intent B2B corporate narrative
    const kanaPart = company.company_name_kana ? `（${company.company_name_kana}）` : "";
    const rawMarket = company.listing_market && company.listing_market !== '非上場' ? company.listing_market : '';
    const marketFormatted = rawMarket
      ? (rawMarket.includes('上場') ? rawMarket : `${rawMarket}上場`)
      : (isListed ? '上場企業' : '');

    let scaleLabel = '企業';
    if (isListed || marketFormatted) {
      scaleLabel = '大手企業';
    } else if ((empCount && empCount >= 300) || (capAmount && capAmount >= 300_000_000)) {
      scaleLabel = '大企業';
    } else if ((empCount && empCount >= 50) || (capAmount && capAmount >= 50_000_000)) {
      scaleLabel = '中堅企業';
    } else if (empCount || capAmount) {
      scaleLabel = '中小企業';
    }

    const industryLabel = industryName || company.jigyo_shumoku || '';

    if (isOnPage) {
      let sent1 = `${companyName}${kanaPart}（法人番号: ${company.corporate_number}）は、`;
      if (fullAddress) {
        sent1 += `${fullAddress}に本社を置く、`;
      }
      if (marketFormatted && industryLabel) {
        sent1 += `${marketFormatted}・${industryLabel}分野の${scaleLabel}です。`;
      } else if (marketFormatted) {
        sent1 += `${marketFormatted}の${scaleLabel}です。`;
      } else if (industryLabel) {
        sent1 += `${industryLabel}分野の${scaleLabel}です。`;
      } else {
        sent1 += `${scaleLabel}です。`;
      }

      let sent2 = '';
      if (repClean && company.establishment_date) {
        const repText = repPos ? `${repPos}の${repClean}氏` : `${repClean}氏`;
        sent2 = `代表者は${repText}が務め、${formatJapaneseDate(company.establishment_date)}に国税庁より法人番号が指定されています。`;
      } else if (repClean) {
        const repText = repPos ? `${repPos}の${repClean}氏` : `${repClean}氏`;
        sent2 = `代表者は${repText}が務めています。`;
      } else if (company.establishment_date) {
        sent2 = `${formatJapaneseDate(company.establishment_date)}に国税庁より法人番号が指定されています。`;
      }

      const kpis: string[] = [];
      if (company.sales_amount) {
        kpis.push(`売上高: ${formatJapaneseCurrency(company.sales_amount, 'ja')}`);
      }
      if (company.ordinary_income) {
        kpis.push(`経常利益: ${formatJapaneseCurrency(company.ordinary_income, 'ja')}`);
      }
      if (company.employee_count) {
        kpis.push(`従業員数: ${company.employee_count.toLocaleString('ja-JP')}名`);
      }
      if (company.capital_amount) {
        kpis.push(`資本金: ${formatJapaneseCurrency(company.capital_amount, 'ja', true)}`);
      }
      const sent3 = kpis.length > 0 ? `最新の公開データとして、${kpis.join('、')}を計上しています。` : '';

      const sent4 = `国税庁公表の適格請求書発行事業者（インボイス制度登録番号: ${invoiceNumber}）として登録済み。${company.phone_number ? `代表電話番号（${company.phone_number}）` : '公式連絡窓口'}${company.fax_number ? `やFAX（${company.fax_number}）` : ''}、決算推移、営業シグナルデータをKigyou-listにて無料公開中。`;

      return `${sent1} ${sent2} ${sent3} ${sent4}`.replace(/[\s\u3000]+/g, ' ').trim();
    }

    const currentYear = new Date().getFullYear();
    const metaKpis: string[] = [];
    if (company.sales_amount) metaKpis.push(`売上:${formatJapaneseCurrency(company.sales_amount, 'ja')}`);
    if (company.employee_count) metaKpis.push(`従業員:${company.employee_count.toLocaleString('ja-JP')}名`);
    if (company.phone_number) metaKpis.push(`TEL:${company.phone_number}`);
    if (repClean) metaKpis.push(`代表:${repClean}`);
    const kpiText = metaKpis.length > 0 ? `。${metaKpis.join('、')}` : '';

    return `【${currentYear}年最新】${companyName}${kanaPart}（${prefectureName || '日本'}）の企業概要・信用調査。法人番号:${company.corporate_number}・インボイス:${invoiceNumber}${kpiText}。財務諸表・役員・連絡先を無料掲載中。`;
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;
  const locale = resolvedParams.locale || 'ja';

  if (!/^\d{13}$/.test(companyId)) {
    return {
      title: locale === 'en' ? 'Company Not Found | Kigyou-list' : locale === 'vi' ? 'Không tìm thấy doanh nghiệp | Kigyou-list' : '企業が見つかりません | Kigyou-list',
    };
  }

  const [company, industryDetailsList] = await Promise.all([
    getCompanyByNumber(companyId),
    getCompanyIndustries(companyId)
  ]);

  if (!company) {
    return {
      title: locale === 'en' ? 'Company Not Found | Kigyou-list' : locale === 'vi' ? 'Không tìm thấy doanh nghiệp | Kigyou-list' : '企業が見つかりません | Kigyou-list',
    };
  }

  const primaryIndustry = industryDetailsList[0] || null;
  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const industryName = primaryIndustry ? primaryIndustry.industry_name : null;
  const summary = generateDynamicSummary(company, locale, industryName, company.prefecture_name);

  const prefPart = company.prefecture_name ? `（${company.prefecture_name}）` : '';
  const currentYear = new Date().getFullYear();
  const pageTitle = locale === 'en'
    ? `${companyName}${prefPart ? ` ${prefPart}` : ''} - ${currentYear} Overview, Corporate Number, Financials, Revenue & Phone | Kigyou-list`
    : locale === 'vi'
    ? `【${currentYear}】${companyName}${prefPart ? ` ${prefPart}` : ''} - Mã số thuế, doanh thu, nhân sự, số điện thoại & hồ sơ pháp nhân | Kigyou-list`
    : `【${currentYear}年最新】${companyName}${prefPart}の会社概要・法人番号・売上高・評判・電話番号 | Kigyou-list`;


  const ogLocale = locale === 'en' ? 'en_US' : locale === 'vi' ? 'vi_VN' : 'ja_JP';

  return {
    title: pageTitle,
    description: summary,
    alternates: {
      canonical: `/${locale}/company/${companyId}`,
      languages: {
        ja: `/ja/company/${companyId}`,
        en: `/en/company/${companyId}`,
        vi: `/vi/company/${companyId}`,
        'x-default': `/ja/company/${companyId}`,
      },
    },
    openGraph: {
      title: pageTitle,
      description: summary,
      url: `https://kigyoulist.com/${locale}/company/${companyId}`,
      siteName: 'Kigyou-list',
      locale: ogLocale,
      type: 'profile',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${companyName} - Kigyou-list`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: summary,
      images: ['/og-image.png'],
    },
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;
  const locale = resolvedParams.locale || 'ja';

  if (!/^\d{13}$/.test(companyId)) {
    return notFound();
  }

  // 1. Fetch Company details, financials, signals, industry details, licenses, and dynamic hub events in parallel
  const [company, financials, rawSignals, companyIndustries, licenses, recentHubEvents] = await Promise.all([
    getCompanyByNumber(companyId),
    getCompanyFinancials(companyId),
    getCompanySignals(companyId),
    getCompanyIndustries(companyId),
    getCompanyLicenses(companyId),
    getRecentHubEventsForCompany(companyId, 50)
  ]);

  if (!company) {
    return notFound();
  }

  const ntaHistory = await getCompanyLegalHistory(company);

  // 1.1 Filter and Map Dynamic Hub Events (Representative change, Invoice change, Relocation, Merger, Bankruptcies, etc.) into Legal History
  const nonHiringHubEvents = (recentHubEvents || []).filter(e => e.event_category !== 'hiring');
  const hubHistoryEvents: LegalHistoryEvent[] = nonHiringHubEvents.map(e => {
    let eventType: LegalHistoryEvent['eventType'] = 'other';
    let eventBadgeJa = '登記・適時開示';
    let eventBadgeEn = 'Registry / Disclosure';
    let eventBadgeVi = 'Đăng ký & Công bố';
    let defaultTitleJa = e.title_ja || '企業公表事項';
    let defaultDetailsJa = e.description_ja || '';

    const cat = e.event_category as string;
    if (cat === 'representative' || cat === 'representative_change') {
      eventType = 'representative_change';
      eventBadgeJa = '代表者変更';
      eventBadgeEn = 'Representative Change';
      eventBadgeVi = 'Đổi người đại diện';
      defaultTitleJa = e.title_ja || '代表取締役・執行役員の異動';
    } else if (cat === 'invoice' || cat === 'invoice_cancel') {
      eventType = 'invoice_change';
      eventBadgeJa = 'インボイス変動';
      eventBadgeEn = 'Invoice Status Change';
      eventBadgeVi = 'Biến động Invoice';
      defaultTitleJa = e.title_ja || '適格請求書発行事業者登録・ステータス変動';
    } else if (cat === 'merger') {
      eventType = 'merger';
      eventBadgeJa = '合併・商号変更';
      eventBadgeEn = 'Merger & Name Change';
      eventBadgeVi = 'Sáp nhập & Đổi tên';
      defaultTitleJa = e.title_ja || '合併または商号（会社名）の変更';
    } else if (cat === 'bankruptcies') {
      eventType = 'bankruptcy';
      eventBadgeJa = '倒産・閉鎖';
      eventBadgeEn = 'Bankruptcy / Dissolution';
      eventBadgeVi = 'Phá sản & Giải thể';
      defaultTitleJa = e.title_ja || '法的整理・破産・特別清算手続';
    } else if (cat === 'relocation') {
      eventType = 'relocation';
      eventBadgeJa = '本店移転';
      eventBadgeEn = 'Headquarters Relocation';
      eventBadgeVi = 'Dời trụ sở chính';
      defaultTitleJa = e.title_ja || '本店所在地・管轄法務局の移転';
    } else if (cat === 'new_establishment') {
      eventType = 'establishment';
      eventBadgeJa = '新設法人';
      eventBadgeEn = 'New Incorporation';
      eventBadgeVi = 'Pháp nhân mới thành lập';
      defaultTitleJa = e.title_ja || '法人設立・登記完了';
    }

    const eventDate = e.event_date ? (e.event_date.includes('T') ? e.event_date.split('T')[0] : e.event_date) : '';

    return {
      id: `hub-event-${e.id}`,
      date: eventDate,
      rawDate: e.event_date,
      eventType,
      eventBadgeJa,
      eventBadgeEn,
      eventBadgeVi,
      titleJa: defaultTitleJa,
      titleEn: e.title_ja || defaultTitleJa,
      titleVi: e.title_ja || defaultTitleJa,
      detailsJa: defaultDetailsJa,
      detailsEn: defaultDetailsJa,
      detailsVi: defaultDetailsJa,
      source: e.source || '金融庁 EDINET / 東証適時開示',
      oldValue: e.old_value,
      newValue: e.new_value,
    };
  });

  // Merge into legalHistory
  const mergedLegalHistory: LegalHistoryEvent[] = [...ntaHistory];
  for (const hubEvt of hubHistoryEvents) {
    const exists = mergedLegalHistory.some(
      n => n.eventType === hubEvt.eventType && n.date === hubEvt.date
    );
    if (!exists) {
      mergedLegalHistory.push(hubEvt);
    }
  }
  mergedLegalHistory.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const legalHistory = mergedLegalHistory;

  // 1.2 Dedicated Hiring Signals (新着求人): Stays in Hiring Signal block only, strictly <= 90 days (3 months), max 10 items
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysIso = ninetyDaysAgo.toISOString().split('T')[0];

  // Additional hiring events from hub_dynamic_events if any
  const hiringFromHub: BusinessSignal[] = (recentHubEvents || [])
    .filter(e => e.event_category === 'hiring')
    .filter(e => {
      const d = e.event_date ? (e.event_date.includes('T') ? e.event_date.split('T')[0] : e.event_date) : '';
      return !d || d >= ninetyDaysIso;
    })
    .map((e, idx) => ({
      id: typeof e.id === 'number' ? e.id : (parseInt(String(e.id), 10) || (900000000 + idx)),
      corporate_number: e.corporate_number,
      signal_type: '求人あり',
      signal_title: e.title_ja,
      signal_date: e.event_date ? (e.event_date.includes('T') ? e.event_date.split('T')[0] : e.event_date) : null,
      source_url: null,
      details: e.description_ja,
      total_count: 1
    }));

  // Combine and sort hiring signals (latest first, max 10 jobs)
  const nonHiringSignals = (rawSignals || []).filter(s => s.signal_type !== '求人あり');
  const existingHiringSignals = (rawSignals || []).filter(s => s.signal_type === '求人あり');

  const mergedHiringSignals = [...existingHiringSignals];
  for (const h of hiringFromHub) {
    const already = mergedHiringSignals.some(
      ex => ex.signal_title === h.signal_title && ex.signal_date === h.signal_date
    );
    if (!already) {
      mergedHiringSignals.push(h);
    }
  }
  mergedHiringSignals.sort((a, b) => (b.signal_date || '').localeCompare(a.signal_date || ''));
  const finalHiringSignals = mergedHiringSignals.slice(0, 10);

  const signals = [...nonHiringSignals, ...finalHiringSignals];

  const t = getTranslations(locale);

  // 2. Resolve primary industry details
  const primaryIndustry = companyIndustries[0] || null;
  let industryCode: string | null = null;
  let industryName: string | null = null;
  if (primaryIndustry) {
    industryCode = primaryIndustry.industry_code;
    industryName = primaryIndustry.industry_name;
  }

  const majorIndustries = companyIndustries.filter(ind => ind.classification_level === '大分類');

  // Resolve latest financial metrics for Quick KPI Ribbon
  const latestFinancial = financials && financials.length > 0 
    ? [...financials].sort((a, b) => b.fiscal_year.localeCompare(a.fiscal_year))[0] 
    : null;
  const latestRevenue = latestFinancial?.revenue || latestFinancial?.sales_amount || company.sales_amount;
  const latestOrdinaryIncome = latestFinancial?.ordinary_income;

  // 3. Fetch related companies in parallel with above (no data dependency yet resolved)
  // NOTE: We start this fetch immediately after resolving the industry code from companyIndustries
  const { sameIndustry, nearby } = await getRelatedCompanies(
    companyId, 
    industryCode ? [industryCode] : [], 
    company.prefecture_code
  );

  // Find a representative industry for the breadcrumb
  const categoryPath = industryCode 
    ? `/${locale}/industry/${industryCode}/location/${company.prefecture_code}`
    : `/${locale}/search?prefecture=${company.prefecture_code}`;

  const prefName = getPrefectureName(company.prefecture_name, locale);
  const industryMappedName = getIndustryName(industryName, locale);

  const categoryName = industryMappedName
    ? (locale === 'en' ? `${prefName} ${industryMappedName} Companies` : locale === 'vi' ? `Danh sách doanh nghiệp ${industryMappedName} tại ${prefName}` : `${prefName}の${industryMappedName}企業一覧`)
    : (locale === 'en' ? `${prefName} Companies` : locale === 'vi' ? `Danh sách doanh nghiệp tại ${prefName}` : `${prefName}の企業一覧`);

  const companyName = locale === 'en' && company.company_name_en ? company.company_name_en : company.company_name;
  const summary = generateDynamicSummary(company, locale, industryName, company.prefecture_name);
  const onPageSummary = generateDynamicSummary(company, locale, industryName, company.prefecture_name, true);

  let snsMap: Record<string, string> = {};
  if (company.sns_links) {
    try {
      snsMap = typeof company.sns_links === 'string' ? JSON.parse(company.sns_links) : company.sns_links;
    } catch {
      snsMap = {};
    }
  }
  const hasSns = Object.keys(snsMap).length > 0;
  const snsUrlList = Object.values(snsMap).filter(Boolean);

  // 5. Generate Schema Markup JSON-LD for Corporation
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Corporation",
    "name": companyName,
    "legalName": company.company_name,
    "taxID": company.corporate_number,
    "identifier": [
      company.corporate_number,
      {
        "@type": "PropertyValue",
        "name": "Japan National Tax Agency Corporate Number (法人番号)",
        "value": company.corporate_number
      }
    ],
    "description": summary,
    "mainEntityOfPage": `https://kigyoulist.com/${locale}/company/${company.corporate_number}`,
    "dateModified": toISOStringLocal(company.updated_at),
    "address": {
      "@type": "PostalAddress",
      "postalCode": company.postal_code || "",
      "addressRegion": prefName || "",
      "addressLocality": company.city_name || "",
      "streetAddress": company.street_address || "",
      "addressCountry": "JP"
    },
    "telephone": company.phone_number || undefined,
    "faxNumber": company.fax_number || undefined,
    "url": company.website_url || undefined,
    "foundingDate": company.establishment_date || undefined,
    ...(company.representative_name ? {
      "founder": {
        "@type": "Person",
        "name": company.representative_name,
        "jobTitle": company.representative_position || "代表者"
      }
    } : {}),
    ...(company.sales_amount || company.capital_amount ? {
      "additionalProperty": [
        ...(company.sales_amount ? [{
          "@type": "PropertyValue",
          "name": "売上高 (Annual Revenue)",
          "value": formatJapaneseCurrency(company.sales_amount, 'ja')
        }] : []),
        ...(company.capital_amount ? [{
          "@type": "PropertyValue",
          "name": "資本金 (Capital Amount)",
          "value": formatJapaneseCurrency(company.capital_amount, 'ja', true)
        }] : [])
      ]
    } : {}),
    ...(company.employee_count ? {
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": company.employee_count
      }
    } : {}),
    ...(industryName ? { "knowsAbout": industryName } : {}),
    ...(industryCode ? { "isicV4": industryCode } : {}),
    ...(company.phone_number ? {
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": company.phone_number,
          "contactType": "customer service",
          "availableLanguage": ["Japanese", "English"]
        }
      ]
    } : {}),
    ...(snsUrlList.length > 0 ? { "sameAs": snsUrlList } : {})
  };

  // 6. Generate BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": locale === 'en' ? "Home" : "ホーム",
        "item": `https://kigyoulist.com/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t.footer.directory,
        "item": `https://kigyoulist.com/${locale}/directory`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryName,
        "item": `https://kigyoulist.com${categoryPath}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": companyName,
        "item": `https://kigyoulist.com/${locale}/company/${company.corporate_number}`
      }
    ]
  };

  // 6. Generate FAQ Schema for Google & Bing Rich Snippets (Synchronized with visible UI)
  const repCleanFaq = cleanRepresentativeName(company.representative_name);
  const repPosFaq = company.representative_position 
    ? cleanRepresentativeName(company.representative_position) 
    : (locale === 'en' ? 'Representative' : locale === 'vi' ? 'Đại diện' : '代表者');
  const invoiceNumberFaq = `T${company.corporate_number}`;
  const isListedFaq = Boolean(company.is_listed || (company.listing_market && company.listing_market !== '非上場'));

  const faqItems: { question: string; answer: string }[] = [];

  if (locale === 'en') {
    faqItems.push({
      question: `What is the official phone number and contact information for ${companyName}?`,
      answer: company.phone_number
        ? `The official representative phone number for ${companyName} is ${company.phone_number}${company.fax_number ? ` (FAX: ${company.fax_number})` : ''}. Head office is located at ${company.full_address || 'Japan'}. Verified contact channels and executive directories are accessible on Kigyou-list.`
        : `${companyName} is registered at ${company.full_address || 'Japan'}. Verified contact channels and representative directories are accessible on Kigyou-list.`
    });
    faqItems.push({
      question: `What is the Japan Corporate Number and Invoice Registration ID for ${companyName}?`,
      answer: `${companyName}'s official 13-digit National Tax Agency Corporate Number is ${company.corporate_number}. It is officially registered as a Qualified Invoice Issuer under Japan's consumption tax invoice system with registration ID ${invoiceNumberFaq}.`
    });
    faqItems.push({
      question: `Where is ${companyName} headquartered?`,
      answer: `${companyName} is officially registered and headquartered at ${company.postal_code ? 'Postal Code ' + company.postal_code + ', ' : ''}${company.full_address || company.street_address || 'Japan'}. Complete regional jurisdiction and legal relocation history are verified via Japan's National Tax Agency.`
    });
    if (company.sales_amount || company.employee_count || company.ordinary_income) {
      faqItems.push({
        question: `What are the annual revenue, profit, and employee count of ${companyName}?`,
        answer: `${companyName} currently employs ${company.employee_count ? company.employee_count.toLocaleString('en-US') + ' personnel' : 'undisclosed count'}. Most recently reported annual revenue stands at ${company.sales_amount ? formatJapaneseCurrency(company.sales_amount, 'en') : 'undisclosed'}${company.ordinary_income ? ` with an ordinary income of ${formatJapaneseCurrency(company.ordinary_income, 'en')}` : ''}.${company.fiscal_month ? ` Fiscal year ends in ${company.fiscal_month}.` : ''}`
      });
    }
    if (repCleanFaq || company.capital_amount) {
      faqItems.push({
        question: `Who is the representative of ${companyName} and what is its capital?`,
        answer: `The official representative of ${companyName} is ${repPosFaq} ${repCleanFaq || 'undisclosed'}, with a registered capital of ${company.capital_amount ? formatJapaneseCurrency(company.capital_amount, 'en', true) : 'undisclosed'}.${isListedFaq ? ` The company is publicly traded on the ${company.listing_market || 'stock exchange'}.` : ' It is privately held.'}`
      });
    }
    if (licenses && licenses.length > 0) {
      faqItems.push({
        question: `What government licenses and permits does ${companyName} hold?`,
        answer: `${companyName} holds authorized government licenses including ${licenses.map((l: any) => l.license_name).slice(0, 3).join(', ')} registered with Japanese ministerial authorities.`
      });
    }
    faqItems.push({
      question: `How can I download corporate intelligence and CSV reports for ${companyName}?`,
      answer: `On Kigyou-list, users can review verified financial metrics, legal registry history, corporate signals (hiring, subsidies, trademarks), and export standardized CSV datasets for B2B intelligence.`
    });

  } else if (locale === 'vi') {
    faqItems.push({
      question: `Số điện thoại và thông tin liên hệ chính thức của ${companyName} là gì?`,
      answer: company.phone_number
        ? `Số điện thoại đại diện chính thức của ${companyName} là ${company.phone_number}${company.fax_number ? ` (FAX: ${company.fax_number})` : ''}. Địa chỉ trụ sở chính đặt tại ${company.full_address || 'Nhật Bản'}. Thông tin liên hệ và ban điều hành được cập nhật trên Kigyou-list.`
        : `${companyName} có trụ sở đăng ký tại ${company.full_address || 'Nhật Bản'}. Thông tin các kênh liên lạc chính thức được tra cứu tại Kigyou-list.`
    });
    faqItems.push({
      question: `Mã số thuế/pháp nhân và mã chứng nhận Invoice của ${companyName} là gì?`,
      answer: `Mã số pháp nhân 13 số do Quốc thuế Nhật Bản (NTA) cấp cho ${companyName} là ${company.corporate_number}. Doanh nghiệp đã được công nhận là cơ sở phát hành hóa đơn hợp lệ (Invoice System) với mã số đăng ký là ${invoiceNumberFaq}.`
    });
    faqItems.push({
      question: `Trụ sở chính của ${companyName} đặt tại đâu?`,
      answer: `Trụ sở chính của ${companyName} tọa lạc tại địa chỉ ${company.postal_code ? 'Mã bưu điện ' + company.postal_code + ', ' : ''}${company.full_address || company.street_address || 'Nhật Bản'}. Lịch sử thay đổi địa chỉ pháp lý được đồng bộ trực tiếp từ cổng thông tin NTA.`
    });
    if (company.sales_amount || company.employee_count || company.ordinary_income) {
      faqItems.push({
        question: `Quy mô nhân sự và doanh thu của ${companyName} là bao nhiêu?`,
        answer: `${companyName} hiện có ${company.employee_count ? company.employee_count.toLocaleString('vi-VN') + ' nhân sự' : 'chưa công bố'}. Doanh thu kỳ gần nhất đạt ${company.sales_amount ? formatJapaneseCurrency(company.sales_amount, 'vi') : 'chưa công bố'}${company.ordinary_income ? `, lợi nhuận thường niên là ${formatJapaneseCurrency(company.ordinary_income, 'vi')}` : ''}.${company.fiscal_month ? ` Kỳ kế toán chốt vào tháng ${company.fiscal_month}.` : ''}`
      });
    }
    if (repCleanFaq || company.capital_amount) {
      faqItems.push({
        question: `Người đại diện pháp luật và vốn điều lệ của ${companyName} là ai?`,
        answer: `Người đại diện pháp luật của ${companyName} là ${repPosFaq} ${repCleanFaq || 'chưa công bố'}, vốn điều lệ đăng ký là ${company.capital_amount ? formatJapaneseCurrency(company.capital_amount, 'vi', true) : 'chưa công bố'}.${isListedFaq ? ` Doanh nghiệp niêm yết trên thị trường ${company.listing_market || 'chứng khoán'}.` : ' Doanh nghiệp chưa niêm yết.'}`
      });
    }
    if (licenses && licenses.length > 0) {
      faqItems.push({
        question: `Các giấy phép kinh doanh và chứng chỉ của ${companyName} gồm những gì?`,
        answer: `${companyName} đã được cấp các giấy phép chuyên ngành chính thức bao gồm ${licenses.map((l: any) => l.license_name).slice(0, 3).join(', ')} từ các bộ ngành Nhật Bản.`
      });
    }
    faqItems.push({
      question: `Làm thế nào để tải dữ liệu doanh nghiệp và báo cáo của ${companyName}?`,
      answer: `Trên nền tảng Kigyou-list, người dùng có thể tra cứu miễn phí hồ sơ tài chính, lịch sử thay đổi pháp nhân, tín hiệu kinh doanh và trích xuất danh sách CSV phục vụ kết nối B2B.`
    });

  } else {
    // Japanese locale (ja) - High intent B2B keywords
    faqItems.push({
      question: `${companyName}の電話番号や問い合わせ先・連絡方法は？`,
      answer: company.phone_number
        ? `${companyName}の代表電話番号は【${company.phone_number}】${company.fax_number ? `、FAX番号は【${company.fax_number}】` : ''}です。本社所在地は【${company.full_address || '日本国内'}】です。最新の連絡窓口や役員情報はKigyou-listで常時更新されています。`
        : `${companyName}の本社所在地は【${company.full_address || '日本国内'}】です。最新の連絡先や登記情報はKigyou-listで確認できます。`
    });
    faqItems.push({
      question: `${companyName}の法人番号および適格請求書（インボイス制度）の登録状況は？`,
      answer: `${companyName}の国税庁指定法人番号は【${company.corporate_number}】です。また、2023年10月施行のインボイス制度における適格請求書発行事業者登録番号は【${invoiceNumberFaq}】として公表・登録されています。`
    });
    faqItems.push({
      question: `${companyName}の本店所在地・本社住所はどこですか？`,
      answer: `${companyName}の本店登記住所は【${company.postal_code ? '〒' + company.postal_code + ' ' : ''}${company.full_address || company.street_address || '日本国内'}】です。管轄の法務局に登記されており、Kigyou-listではGoogleマップや過去の本店移転履歴も照会可能です。`
    });
    if (company.sales_amount || company.employee_count || company.ordinary_income) {
      faqItems.push({
        question: `${companyName}の売上高・業績・従業員数はどれくらいですか？`,
        answer: `${companyName}の最新の公表従業員数は【${company.employee_count ? company.employee_count.toLocaleString('ja-JP') + '名' : '非公開'}】、売上高は【${company.sales_amount ? formatJapaneseCurrency(company.sales_amount, 'ja') : '非公開'}】${company.ordinary_income ? `、経常利益は【${formatJapaneseCurrency(company.ordinary_income, 'ja')}】` : ''}です。${company.fiscal_month ? `決算期は毎年【${company.fiscal_month}】となります。` : ''}`
      });
    }
    if (repCleanFaq || company.capital_amount) {
      faqItems.push({
        question: `${companyName}の代表取締役・社長や資本金は？`,
        answer: `${companyName}の代表者は【${repPosFaq ? repPosFaq + ' ' : ''}${repCleanFaq || '非公開'}】氏、資本金は【${company.capital_amount ? formatJapaneseCurrency(company.capital_amount, 'ja', true) : '非公開'}】です。${isListedFaq ? `株式市場においては【${company.listing_market || '上場'}】企業として位置づけられています。` : '非上場企業です。'}`
      });
    }
    if (licenses && licenses.length > 0) {
      faqItems.push({
        question: `${companyName}の保有許認可や主な事業内容は？`,
        answer: `${companyName}は【${industryName || company.jigyo_shumoku || '各事業'}】を展開しており、公的許認可として【${licenses.map((l: any) => l.license_name).slice(0, 3).join('、')}】等の公的許認可・届出実績を有しています。`
      });
    }
    faqItems.push({
      question: `${companyName}の企業信用調査レポートや営業リストデータを取得するには？`,
      answer: `B2B企業データベース「Kigyou-list（企業リスト）」にて、${companyName}の最新企業データ、財務諸表推移、役員・株主構成、営業シグナル（求人・補助金・商標等）を無料閲覧およびCSVダウンロードいただけます。`
    });
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };


  const localizedStatus = locale === 'en' 
    ? (company.status === '活動中' ? 'Active' : company.status === '閉鎖' ? 'Closed' : company.status === '解散' ? 'Dissolved' : company.status)
    : company.status;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-slate-100 transition-colors">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Global Standard Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col gap-5">
        
        {/* Visual Breadcrumbs */}
        <nav className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-primary dark:hover:text-slate-200 transition-colors shrink-0">
            {locale === 'en' ? 'Home' : 'ホーム'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <Link href={`/${locale}/directory`} className="hover:text-primary dark:hover:text-slate-200 transition-colors shrink-0">
            {t.footer.directory}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <Link href={categoryPath} className="hover:text-primary dark:hover:text-slate-200 transition-colors truncate max-w-[140px] sm:max-w-xs shrink-0" title={categoryName}>{categoryName}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[140px] sm:max-w-[240px]" aria-current="page" title={companyName}>{companyName}</span>
        </nav>

        {/* Company Title Banner (Enterprise Trust Card) */}
        <section className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex flex-row gap-4 sm:gap-5 items-start min-w-0">
              {/* Crisp Corporate Badge with Dynamic Logo & Fallback */}
              <CompanyLogo
                websiteUrl={company.website_url}
                logoUrl={company.logo_url}
                companyName={companyName}
                corporateNumber={company.corporate_number}
              />
              
              <div className="flex flex-col gap-2 min-w-0">
                {/* Trust Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                    company.status === '閉鎖' || company.status === '解散'
                      ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                      : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      company.status === '閉鎖' || company.status === '解散'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`} />
                    {localizedStatus}
                  </span>

                  {company.is_listed && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-900 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B4F8A] dark:bg-blue-400"></span>
                      {company.listing_market ? `${company.listing_market}上場` : '上場企業'}
                      {company.stock_code ? ` (${company.stock_code})` : ''}
                    </span>
                  )}

                  {company.is_claimed && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {locale === 'en' ? 'Verified Business' : locale === 'vi' ? 'Chính chủ đã xác minh' : '公式認証企業'}
                    </span>
                  )}

                  {majorIndustries.map((ind, idx) => (
                    <Link 
                      key={idx}
                      href={`/${locale}/industry/${ind.industry_code}/location/${company.prefecture_code}`}
                      className="text-[11px] font-medium text-slate-700 hover:text-[#1B4F8A] bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {ind.industry_code}.{(t.majorIndustries as Record<string, string>)?.[ind.industry_code] || ind.industry_name}
                    </Link>
                  ))}

                  <span className="inline-flex items-center text-[11px] font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                    {t.company.corporateNumber.replace('{number}', company.corporate_number)}
                  </span>
                  
                  {/* Data freshness trust badge */}
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {locale === 'en' ? 'Updated' : locale === 'vi' ? 'Cập nhật' : '更新'}: {formatShortDate(company.updated_at)}
                  </span>
                </div>

                {/* Main Heading H1 with 1-click copy */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900 dark:text-white tracking-tight break-words">
                    {companyName}
                  </h1>
                  <CopyTextButton text={companyName} label={locale === 'en' ? 'Copy name' : locale === 'vi' ? 'Sao chép tên' : '社名をコピー'} />
                </div>
              </div>
            </div>

            <CompanyActions 
              corporateNumber={company.corporate_number} 
              companyName={companyName} 
              websiteUrl={company.website_url} 
              phone={company.phone_number}
              email=""
              fax={company.fax_number}
              representativeName={company.representative_name}
              representativePosition={company.representative_position}
              companyNameKana={company.company_name_kana}
              companyNameEn={company.company_name_en}
              postalCode={company.postal_code}
              fullAddress={company.full_address || company.street_address}
              capitalAmount={company.capital_amount}
              employeeCount={company.employee_count}
              salesAmount={company.sales_amount}
              fiscalMonth={company.fiscal_month}
              contactFormUrl={company.contact_form_url}
              recruitUrl={company.recruit_url}
              jigyoShumoku={company.jigyo_shumoku}
              mainClients={company.main_clients}
              mainBanks={company.main_banks}
              snsLinks={company.sns_links}
              prTitle={company.pr_title}
              prMessage={company.pr_message}
              isClaimed={Boolean(company.is_claimed)}
              claimedAt={company.claimed_at}
              claimedByEmail={company.claimed_by_email}
              licenses={licenses}
            />
          </div>

          {/* Quick B2B KPI Ribbon (4 Golden Metrics) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {locale === 'en' ? 'Latest Revenue' : locale === 'vi' ? 'Doanh thu gần nhất' : '最新売上高'}
                {latestFinancial?.fiscal_year ? ` (${latestFinancial.fiscal_year}期)` : ''}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatJapaneseCurrency(latestRevenue, locale) || t.company.unregistered}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {locale === 'en' ? 'Ordinary Profit' : locale === 'vi' ? 'Lợi nhuận thường niên' : '経常利益'}
                {latestFinancial?.fiscal_year ? ` (${latestFinancial.fiscal_year}期)` : ''}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {latestOrdinaryIncome ? formatJapaneseCurrency(latestOrdinaryIncome, locale) : '—'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {locale === 'en' ? 'Employees' : locale === 'vi' ? 'Quy mô nhân sự' : '従業員数'}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {company.employee_count ? (locale === 'en' ? `${company.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${company.employee_count.toLocaleString()} nhân sự` : `${company.employee_count.toLocaleString('ja-JP')}名`) : t.company.unregistered}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {locale === 'en' ? 'Capital Amount' : locale === 'vi' ? 'Vốn điều lệ' : '資本金'}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatJapaneseCurrency(company.capital_amount, locale, true) || t.company.unregistered}
              </span>
            </div>
          </div>
        </section>

        {/* Quick Section Anchor Jump-Links (Sticky Sub-Navigation Dossier Bar) */}
        <nav 
          aria-label="Page Sections" 
          className="sticky top-14 z-20 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-2xs overflow-x-auto scrollbar-none flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          <a 
            href="#overview" 
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{t.company.navOverview || "基本情報・連絡先"}</span>
          </a>
          <a 
            href="#history" 
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{t.company.navHistory || "主な変更履歴"}</span>
          </a>
          {licenses && licenses.length > 0 && (
            <a 
              href="#licenses" 
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{locale === 'en' ? 'Licenses' : locale === 'vi' ? 'Giấy phép' : '保有許認可'}</span>
            </a>
          )}

          {financials && financials.length > 0 && (
            <a 
              href="#financials" 
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
              <span>{t.company.navFinancials || "決算推移"}</span>
            </a>
          )}
          <a 
            href="#signals" 
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{t.company.navSignals || "営業シグナル"}</span>
          </a>
          <a 
            href="#reputation" 
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{t.company.navReputation || "評判・ニュース"}</span>
          </a>
          <a 
            href="#faq" 
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{t.company.navFaq || "FAQ"}</span>
          </a>
          <a 
            href="#competitors" 
            className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1B4F8A] dark:hover:text-blue-300 transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
            <span>{t.company.navRelated || "同業・近隣企業"}</span>
          </a>
        </nav>

        {/* 2-Column Split Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          
          {/* LEFT 2 COLUMNS: Profile Dossier, History, Licenses, Financials, Signals, Reputation, FAQ */}
          <div className="lg:col-span-2 flex flex-col gap-5 lg:gap-6">
            
            {/* 1. Basic Info & Official Contacts Section */}
            <section id="overview" className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-24">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
                  {t.company.basicInfo}・{t.company.contactInfo || "公式連絡先"}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>No. {company.corporate_number}</span>
                  <CopyTextButton text={company.corporate_number} />
                </div>
              </div>

              {/* Dynamic Answer-First Entity Overview block for AI Extractors & Google Search Snippets */}
              <div 
                className="mb-5 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30"
                itemScope 
                itemType="https://schema.org/Corporation"
              >
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#1B4F8A] dark:text-blue-400">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {locale === 'en' ? 'Corporate Profile Briefing' : locale === 'vi' ? 'Tóm tắt hồ sơ doanh nghiệp' : '企業サマリー・事業概要'}
                  </span>
                </div>
                <meta itemProp="name" content={companyName} />
                <meta itemProp="taxID" content={company.corporate_number} />
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300" itemProp="description">
                  {onPageSummary}
                </p>
              </div>

              {/* Verified Company PR Section (Only renders if an official statement has been published) */}
              <CompanyPRSection
                corporateNumber={company.corporate_number}
                isClaimed={Boolean(company.is_claimed)}
                prTitle={company.pr_title}
                prMessage={company.pr_message}
                locale={locale}
              />

              {/* Key-Value Dossier Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-sm">

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.kana}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{company.company_name_kana || "-"}</span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.establishmentDate}</span>
                  <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {locale === 'en' && company.establishment_date ? formatEnglishDate(company.establishment_date) : (company.establishment_date || "-")}
                  </span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.address}</span>
                    {company.full_address && (
                      <CopyTextButton text={company.full_address} />
                    )}
                  </div>
                  <div className="flex items-start gap-2 flex-wrap">
                    {company.postal_code && (
                      <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                        〒{company.postal_code}
                      </span>
                    )}
                    {company.prefecture_code && (
                      <Link 
                        href={`/${locale}/area/${company.prefecture_code}`}
                        className="text-xs font-medium text-[#1B4F8A] hover:underline bg-[#1B4F8A]/5 hover:bg-[#1B4F8A]/10 dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 px-2 py-0.5 rounded border border-[#1B4F8A]/20 dark:border-blue-800/40 shrink-0 transition-colors inline-flex items-center gap-1"
                        title={locale === 'en' ? `Browse companies in ${prefName}` : locale === 'vi' ? `Xem danh sách doanh nghiệp tại ${prefName}` : `${prefName}の企業一覧を見る`}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{prefName}</span>
                      </Link>
                    )}
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {company.full_address || "-"}
                    </span>
                  </div>
                </div>
                
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.representative}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {company.representative_name 
                      ? `${(locale === 'en' || locale === 'vi') && company.representative_position ? `${translatePosition(company.representative_position, locale)} ` : ""}${company.representative_name}`
                      : "-"}
                  </span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.capital}</span>
                  <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {company.capital_amount ? formatJapaneseCurrency(company.capital_amount, locale, true) : "-"}
                  </span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">{t.company.employees}</span>
                  <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {company.employee_count ? (locale === 'en' ? `${company.employee_count.toLocaleString()} employees` : locale === 'vi' ? `${company.employee_count.toLocaleString()} nhân viên` : `${company.employee_count.toLocaleString()}名`) : "-"}
                  </span>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {locale === 'en' ? 'Corporate Number' : locale === 'vi' ? 'Mã số doanh nghiệp' : '法人番号'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {company.corporate_number}
                    </span>
                    <CopyTextButton text={company.corporate_number} />
                  </div>
                </div>

                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {locale === 'en' ? 'Invoice Number' : locale === 'vi' ? 'Số đăng ký Invoice' : 'インボイス登録番号'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      T{company.corporate_number}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                      （{locale === 'en' ? 'Registered' : locale === 'vi' ? 'Đã đăng ký' : '国税庁登録済'}）
                    </span>
                  </div>
                </div>

                {/* Listing Status */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {locale === 'en' ? 'Listing Status' : locale === 'vi' ? 'Tình trạng niêm yết' : '上場区分'}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {company.is_listed ? (
                      <>
                        <span>{company.listing_market ? `${company.listing_market}上場` : '上場企業'}</span>
                        {company.stock_code && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums ml-1">
                            （証券コード: {company.stock_code}）
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        {locale === 'en' ? 'Unlisted' : locale === 'vi' ? 'Chưa niêm yết' : '非上場'}
                      </span>
                    )}
                  </span>
                </div>

                {/* 1. Phone number */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {t.company.phonePublic || "代表電話番号"}
                  </span>
                  {company.phone_number ? (
                    <ObfuscatedPhone encodedPhone={btoa(company.phone_number)} />
                  ) : (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">-</span>
                  )}
                </div>

                {/* 2. Official Website URL */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {t.company.websitePublic || "公式ウェブサイト"}
                  </span>
                  {company.website_url ? (
                    <a 
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#1B4F8A] hover:underline dark:text-blue-400 truncate max-w-full block"
                      title={company.website_url}
                    >
                      {cleanDisplayUrl(company.website_url)}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">-</span>
                  )}
                </div>

                {/* 3. FAX number */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {t.company.fax || "FAX番号"}
                  </span>
                  <span className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {company.fax_number || "-"}
                  </span>
                </div>

                {/* 4. Email address */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                    {t.company.email || "メールアドレス"}
                  </span>
                  {company.email_address ? (
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {locale === 'en' ? 'Available (CSV)' : locale === 'vi' ? 'Có sẵn (trong CSV)' : 'あり (CSV出力で提供)'}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">-</span>
                  )}
                </div>

                {/* 5. Contact Form */}
                {company.contact_form_url && (
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                      {locale === 'en' ? 'Contact Form' : locale === 'vi' ? 'Biểu mẫu liên hệ' : 'お問い合わせフォーム'}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {locale === 'en' ? 'Available (Form Outreach)' : locale === 'vi' ? 'Có sẵn (Hỗ trợ gửi)' : 'あり (営業代行対応)'}
                    </span>
                  </div>
                )}

                {/* 6. Recruitment Page */}
                {company.recruit_url && (
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                      {locale === 'en' ? 'Recruitment' : locale === 'vi' ? 'Trang tuyển dụng' : '採用情報'}
                    </span>
                    <a 
                      href={company.recruit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#1B4F8A] hover:underline dark:text-blue-400 truncate max-w-full block"
                    >
                      {locale === 'en' ? 'Career Page' : locale === 'vi' ? 'Xem trang tuyển dụng' : '公式採用ページを見る'}
                    </a>
                  </div>
                )}

                {company.fiscal_month && (
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                      {locale === 'en' ? 'Fiscal Year-End' : locale === 'vi' ? 'Tháng quyết toán' : '決算期'}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {company.fiscal_month}
                    </span>
                  </div>
                )}

                {company.main_clients && (
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1 md:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                      {locale === 'en' ? 'Major Clients' : locale === 'vi' ? 'Khách hàng / Đối tác chính' : '主要取引先'}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {company.main_clients}
                    </span>
                  </div>
                )}

                {company.main_banks && (
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1 md:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1">
                      {locale === 'en' ? 'Main Banks' : locale === 'vi' ? 'Ngân hàng giao dịch chính' : '主要取引銀行'}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {company.main_banks}
                    </span>
                  </div>
                )}

                {/* 7. SNS Social Profiles */}
                {hasSns && (
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 col-span-1 md:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1.5">
                      {locale === 'en' ? 'Official Social Media (SNS)' : locale === 'vi' ? 'Mạng xã hội chính thức (SNS)' : '公式SNSアカウント'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {snsMap.twitter && (
                        <a 
                          href={snsMap.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="X (Twitter)"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          <span>X</span>
                        </a>
                      )}
                      {snsMap.facebook && (
                        <a 
                          href={snsMap.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="Facebook"
                        >
                          <svg className="w-3 h-3 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          <span>Facebook</span>
                        </a>
                      )}
                      {snsMap.wantedly && (
                        <a 
                          href={snsMap.wantedly} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="Wantedly"
                        >
                          <span className="font-bold text-xs text-[#00A4BB]">W</span>
                          <span>Wantedly</span>
                        </a>
                      )}
                      {snsMap.note && (
                        <a 
                          href={snsMap.note} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="note"
                        >
                          <span className="font-bold text-xs text-[#2cb696]">n</span>
                          <span>note</span>
                        </a>
                      )}
                      {snsMap.linkedin && (
                        <a 
                          href={snsMap.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="LinkedIn"
                        >
                          <svg className="w-3 h-3 fill-current text-[#0A66C2]" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {snsMap.line && (
                        <a 
                          href={snsMap.line} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="LINE"
                        >
                          <svg className="w-3 h-3 fill-current text-[#06C755]" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.992z"/></svg>
                          <span>LINE</span>
                        </a>
                      )}
                      {snsMap.youtube && (
                        <a 
                          href={snsMap.youtube} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="YouTube"
                        >
                          <svg className="w-3 h-3 fill-current text-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          <span>YouTube</span>
                        </a>
                      )}
                      {snsMap.instagram && (
                        <a 
                          href={snsMap.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          title="Instagram"
                        >
                          <svg className="w-3 h-3 fill-current text-pink-600" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          <span>Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Industry Classification Tags */}
                <div className="col-span-1 md:col-span-2 pt-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-1.5">{t.company.tags}</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                    {(() => {
                      const mediumInds = companyIndustries.filter(ind => ind.classification_level === '中分類');
                      if (mediumInds.length > 0) {
                        return mediumInds.map((ind, idx) => (
                          <Link 
                            key={idx} 
                            href={`/${locale}/industry/${ind.industry_code}/location/${company.prefecture_code || '13'}`}
                            className="text-xs font-normal px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#1B4F8A] dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 transition-colors inline-block"
                            title={locale === 'en' ? `Browse ${getIndustryName(ind.industry_name, locale)} companies` : locale === 'vi' ? `Xem danh sách công ty ${getIndustryName(ind.industry_name, locale)}` : `${getIndustryName(ind.industry_name, locale)}の企業一覧を見る`}
                          >
                            <span>{ind.industry_code}.{getIndustryName(ind.industry_name, locale)}</span>
                          </Link>
                        ));
                      }

                      const tags = company.jigyo_shumoku 
                        ? company.jigyo_shumoku.replace(' (AI確認済)', '').split(',')
                        : [];
                      return tags.length > 0 ? (
                        tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs font-normal px-2 py-0.5 rounded bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60 transition-colors inline-block"
                          >
                            {getIndustryName(tag.trim(), locale)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">{t.company.unregistered}</span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Honeypot trap link for scrapers (invisible to actual users) */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a 
                href="/api/sys-check" 
                style={{ display: 'none' }} 
                tabIndex={-1} 
                aria-hidden="true" 
                data-nosnippet
              >
                {t.company.legalIntegrityLink || "システム整合性の検証リンク (System Health Verification)"}
              </a>

              {/* Company Correction & Enrichment Action Bar */}
              <CompanyCorrectionBar
                corporateNumber={company.corporate_number}
                companyName={companyName}
              />
            </section>

            {/* 2. Legal Registry History Section (国税庁 法人番号・インボイスWeb-API公表データ) */}
            <div id="history" className="scroll-mt-24">
              <CompanyLegalHistoryTimeline
                corporateNumber={company.corporate_number}
                companyName={companyName}
                events={legalHistory}
                locale={locale}
                translations={{
                  title: t.company.legalHistoryTitle,
                  desc: t.company.legalHistoryDesc,
                  officialBadge: t.company.legalHistoryOfficialBadge,
                  emptyText: t.company.legalHistoryEmpty,
                  viewNtaOfficial: t.company.viewNtaOfficialRegistry,
                  viewNtaInvoice: t.company.viewNtaInvoiceRegistry,
                }}
              />
            </div>

            {/* 3. Corporate Official Licenses & Certifications (建設業・労働者派遣・有料職業紹介等の官公庁許認可) */}
            {licenses && licenses.length > 0 && (
              <div id="licenses" className="scroll-mt-24">
                <CompanyLicensesSection
                  corporateNumber={company.corporate_number}
                  companyName={companyName}
                  licenses={licenses}
                  locale={locale}
                />
              </div>
            )}

            {/* 4. Financial Chart Section */}
            {financials && financials.length > 0 && (
              <section id="financials" className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {t.company.financialTrend}
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {locale === 'en' ? `Past ${financials.length} FYs` : locale === 'vi' ? `${financials.length} kỳ gần nhất` : `直近${financials.length}期公表`}
                  </span>
                </div>

                <CompanyFinancials financials={financials} />
              </section>
            )}

            {/* 5. Intent Signals Section */}
            <section id="signals" className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t.company.signalTimeline}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {signals.length} {locale === 'en' ? 'signals' : locale === 'vi' ? 'tín hiệu' : '件のシグナル'}
                </span>
              </div>

              {signals.length > 0 ? (
                <CompanySignalsTimeline signals={signals} />
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t.company.noSignals}
                </div>
              )}
            </section>

            {/* 6. External Reputation, Compliance & Media Verification Section */}
            <section id="reputation" className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t.company.reputationCheckTitle || "企業評判・公式ニュース"}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {locale === 'en' ? '6 sources' : locale === 'vi' ? '6 nguồn tra cứu' : '6主要ポータル連携'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {t.company.reputationCheckDesc || "主要ポータル・公的情報源で企業の風評、プレスリリース、口コミをワンクリックで検索できます。"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. PR TIMES Press Releases */}
                <a
                  href={`https://prtimes.jp/main/html/searchrlp/company_id/keywords/${encodeURIComponent(companyName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                      <Newspaper className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                        {t.company.searchPrTimes || "PR TIMES (公式プレスリリース)"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">prtimes.jp</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                </a>

                {/* 2. OpenWork Employee Reviews */}
                <a
                  href={`https://www.openwork.jp/company_list?field=&pref=&src_str=${encodeURIComponent(companyName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                        {t.company.searchOpenWork || "OpenWork (社員クチコミ)"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">openwork.jp</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                </a>

                {/* 3. Tenshoku Kaigi */}
                <a
                  href={`https://jobtalk.jp/companies?keyword=${encodeURIComponent(companyName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-blue-500/10 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                        {t.company.searchTenshoku || "転職会議 (年収・評判)"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">jobtalk.jp</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                </a>

                {/* 4. jpnumber phone search */}
                {company.phone_number ? (
                  <a
                    href={`https://www.jpnumber.com/numbersearch.do?number=${encodeURIComponent(company.phone_number.replace(/\D/g, ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-amber-500/10 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                          {t.company.searchJpnumber || "jpnumber (電話番号検索)"}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">{company.phone_number}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                  </a>
                ) : (
                  <a
                    href={`https://www.google.co.jp/search?q=${encodeURIComponent(`${companyName} 評判 口コミ`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-indigo-500/10 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
                        <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                          Google検索 ({companyName} 評判)
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">google.co.jp</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                  </a>
                )}

                {/* 5. Google Maps Physical Location */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${companyName} ${company.full_address || company.prefecture_name || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-rose-500/10 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                        {t.company.searchGoogleMaps || "Googleマップ (現地確認)"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">maps.google.com</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                </a>

                {/* 6. Google News */}
                <a
                  href={`https://news.google.com/search?q=${encodeURIComponent(companyName)}&hl=ja&gl=JP&ceid=JP:ja`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1B4F8A] dark:border-slate-700/80 dark:hover:border-blue-500/60 bg-slate-50/60 hover:bg-white dark:bg-slate-800/30 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-sky-500/10 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block truncate group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300">
                        {t.company.searchGoogleNews || "Googleニュース"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">news.google.com</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-300 shrink-0 ml-2" />
                </a>
              </div>
            </section>

            {/* 7. Frequently Asked Questions (FAQ) Section - Matches Google FAQ Schema */}
            <section id="faq" className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-150 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t.company.faqTitle || (locale === 'en' ? 'Frequently Asked Questions' : locale === 'vi' ? 'Câu hỏi thường gặp' : 'よくあるご質問（FAQ）')}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {locale === 'en' ? `${faqSchema.mainEntity.length} Q&As` : locale === 'vi' ? `${faqSchema.mainEntity.length} câu hỏi` : `全${faqSchema.mainEntity.length}問`}
                </span>
              </div>

              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                {faqSchema.mainEntity.map((item, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2 mb-1.5">
                      <span className="w-4 h-4 rounded text-[10px] font-bold font-mono flex items-center justify-center shrink-0 bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950/60 dark:text-blue-300 mt-0.5">
                        Q
                      </span>
                      <span className="flex-1 leading-snug">{item.name}</span>
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 pl-6">
                      {item.acceptedAnswer.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT 1 COLUMN: High-Intent Actions & Competitor Comparison */}
          <div className="flex flex-col gap-5 lg:gap-6 lg:sticky lg:top-20 self-start">
            
            {/* 1. B2B Outreach & Action Box */}
            <CompanyConversionBar
              corporateNumber={company.corporate_number}
              companyName={companyName}
              prefectureName={prefName}
              industryName={industryMappedName}
              locale={locale}
              variant="sidebar"
            />

            {/* 2. SEO Internal Linking Matrix (Related & Nearby Companies) */}
            <section id="competitors" className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col gap-6 scroll-mt-24">

              {/* Same Industry Links (同業他社) */}
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-150 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {t.company.sameIndustry}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {sameIndustry.length}社
                  </span>
                </div>
                {sameIndustry.length > 0 ? (
                  <div className="w-full">
                    {/* Column header */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 px-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-medium uppercase tracking-wider text-slate-400 items-center">
                      <span className="w-4 text-center">#</span>
                      <span>{locale === 'en' ? 'Company' : locale === 'vi' ? 'Công ty' : '企業名'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Revenue' : locale === 'vi' ? 'Doanh thu' : '売上高'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Ord. Profit' : locale === 'vi' ? 'Lợi nhuận' : '経常利益'}</span>
                    </div>
                    {sameIndustry.map((item, idx) => {
                      const name = locale === 'en' && item.company_name_en ? item.company_name_en : item.company_name;
                      const salesStr = formatCompactCurrency(item.sales_amount, locale);
                      const ordIncStr = formatCompactCurrency(item.ordinary_income, locale);
                      return (
                        <Link
                          key={item.corporate_number}
                          href={`/${locale}/company/${item.corporate_number}`}
                          className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors items-center"
                        >
                          <span className="w-4 h-4 rounded text-[10px] font-bold font-mono tabular-nums flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-[#1B4F8A] group-hover:text-white transition-colors">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate min-w-0" title={name}>
                            {name}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {salesStr}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {ordIncStr}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{t.company.noRelatedSameIndustry}</span>
                )}
                {/* Hub Link to full industry/location category page */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  <Link 
                    href={categoryPath}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:text-[#143D6C] dark:hover:text-blue-300 transition-colors group"
                  >
                    <span>{t.company.viewMoreSameIndustry || "この業界・地域の企業一覧をもっと見る"}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              {/* Nearby Prefecture Links (近隣企業) */}
              <div>
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-150 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#1B4F8A]/10 dark:bg-blue-950/60 flex items-center justify-center text-[#1B4F8A] dark:text-blue-400 shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {t.company.nearby}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {nearby.length}社
                  </span>
                </div>
                {nearby.length > 0 ? (
                  <div className="w-full">
                    {/* Column header */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 px-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-medium uppercase tracking-wider text-slate-400 items-center">
                      <span className="w-4 text-center">#</span>
                      <span>{locale === 'en' ? 'Company' : locale === 'vi' ? 'Công ty' : '企業名'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Revenue' : locale === 'vi' ? 'Doanh thu' : '売上高'}</span>
                      <span className="text-right w-16 sm:w-20">{locale === 'en' ? 'Ord. Profit' : locale === 'vi' ? 'Lợi nhuận' : '経常利益'}</span>
                    </div>
                    {nearby.map((item, idx) => {
                      const name = locale === 'en' && item.company_name_en ? item.company_name_en : item.company_name;
                      const salesStr = formatCompactCurrency(item.sales_amount, locale);
                      const ordIncStr = formatCompactCurrency(item.ordinary_income, locale);
                      return (
                        <Link
                          key={item.corporate_number}
                          href={`/${locale}/company/${item.corporate_number}`}
                          className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors items-center"
                        >
                          <span className="w-4 h-4 rounded text-[10px] font-bold font-mono tabular-nums flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-[#1B4F8A] group-hover:text-white transition-colors">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary truncate min-w-0" title={name}>
                            {name}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {salesStr}
                          </span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right w-16 sm:w-20">
                            {ordIncStr}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{t.company.noRelatedNearby}</span>
                )}
                {/* Hub Link to full prefecture area page */}
                {company.prefecture_code && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <Link 
                      href={`/${locale}/area/${company.prefecture_code}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:text-[#143D6C] dark:hover:text-blue-300 transition-colors group"
                    >
                      <span>{(t.company.viewMoreNearby || "{pref}の企業一覧をもっと見る").replace('{pref}', prefName)}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>

        {/* FULL-WIDTH BOTTOM: Dynamic Hubs & Bidirectional Mesh Backlinks (Spiderweb Network) */}
        <section id="spiderweb" className="scroll-mt-24">
          <CompanyHubBacklinks
            corporateNumber={company.corporate_number}
            companyName={companyName}
            prefectureCode={company.prefecture_code}
            prefectureName={company.prefecture_name}
            establishmentDate={company.establishment_date}
            status={company.status}
            hasHiring={Boolean(company.has_hiring)}
            locale={locale}
            recentEvents={recentHubEvents}
          />
        </section>

        {/* Spider-Web Cross Linking: Related Categories & Regional Hubs */}
        <section className="bg-white border border-slate-200 dark:bg-[#161B22] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-800">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
              {t.company.relatedCategories || "関連カテゴリ・業界一覧"}
            </h2>
            <Link 
              href={`/${locale}/directory`} 
              className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>{t.footer.directory}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {/* Primary Category Link */}
            {categoryPath && (
              <Link
                href={categoryPath}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1B4F8A]/5 hover:bg-[#1B4F8A]/10 text-[#1B4F8A] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 border border-[#1B4F8A]/20 dark:border-blue-800/40 transition-colors inline-flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-[#1B4F8A] dark:text-blue-400" />
                <span>{categoryName}</span>
              </Link>
            )}

            {/* Regional Prefecture Hub Link */}
            {company.prefecture_code && (
              <Link
                href={`/${locale}/area/${company.prefecture_code}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === 'en' ? `All ${prefName} Companies` : locale === 'vi' ? `Tất cả doanh nghiệp tại ${prefName}` : `${prefName}の全企業一覧`}</span>
              </Link>
            )}

            {/* Major Industry Hubs in this prefecture */}
            {majorIndustries.map((ind, idx) => (
              <Link
                key={idx}
                href={`/${locale}/industry/${ind.industry_code}/location/${company.prefecture_code || '13'}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {prefName} × {ind.industry_name}
              </Link>
            ))}

            {/* Global Directory Link */}
            <Link
              href={`/${locale}/directory`}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {locale === 'en' ? 'Japan 47 Prefectures Directory' : locale === 'vi' ? 'Danh bạ 47 tỉnh thành Nhật Bản' : '全国47都道府県・全業界インデックス'}
            </Link>
          </div>
        </section>

        {/* Unified Official Data Source Attribution & Disclaimer (Enterprise B2B Standard) */}
        <div className="pt-2 pb-2 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-4xl mx-auto px-4">
            {locale === 'en' 
              ? '※ Corporate information on this profile is aggregated, verified, and structured based on official open data provided by the National Tax Agency (国税庁) and METI gBizINFO.'
              : locale === 'vi' 
              ? '※ Thông tin doanh nghiệp trên trang này được tổng hợp, đối soát và chuẩn hóa tự động từ các nguồn dữ liệu mở công khai của Tổng cục Thuế Quốc gia (国税庁) và METI gBizINFO.'
              : '※ 本ページの掲載企業情報は、国税庁法人番号公表サイト、適格請求書発行事業者公表サイトおよび経済産業省gBizINFO等の公的オープンデータを基に自動収集・統合・構造化して提供しています。'}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
