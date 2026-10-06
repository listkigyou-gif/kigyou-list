import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import {
  countTargetAudience,
  getTargetAudienceBatch,
  renderTemplate,
  buildUnsubscribeUrl,
  TargetFilters,
} from '@/lib/marketing';

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { filters = {}, subject = '', body_html = '' } = body;

    const targetFilters: TargetFilters = {
      prefecture_name: filters.prefecture_name || undefined,
      min_employees: filters.min_employees ? parseInt(filters.min_employees, 10) : undefined,
      has_website: Boolean(filters.has_website),
      exclude_recent_days: filters.exclude_recent_days !== undefined ? parseInt(filters.exclude_recent_days, 10) : 30,
    };

    const totalCount = await countTargetAudience(targetFilters);
    const sampleCompanies = await getTargetAudienceBatch(targetFilters, 3, 0);

    let renderedSubject = subject;
    let renderedHtml = body_html;
    let sampleCompany = sampleCompanies[0] || {
      corporate_number: '1010001000001',
      company_name: 'サンプル株式会社',
      representative_name: '代表 太郎',
      email_address: 'sample@example.com',
      prefecture_name: targetFilters.prefecture_name || '東京都',
      city_name: '千代田区',
      website_url: 'https://example.com',
      employee_count: 50,
      last_emailed_at: null,
    };

    const unsubscribeUrl = buildUnsubscribeUrl(sampleCompany.email_address || 'sample@example.com');
    renderedSubject = renderTemplate(subject, sampleCompany, unsubscribeUrl);
    renderedHtml = renderTemplate(body_html, sampleCompany, unsubscribeUrl);

    return NextResponse.json({
      success: true,
      total_count: totalCount,
      sample_company: sampleCompany,
      rendered_subject: renderedSubject,
      rendered_html: renderedHtml,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/preview POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
