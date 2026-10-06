import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import {
  renderTemplate,
  buildUnsubscribeUrl,
  sendEmailViaResend,
  CompanyRecipient,
} from '@/lib/marketing';

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { test_email, subject, body_html, sample_company } = body;

    if (!test_email || !test_email.includes('@')) {
      return NextResponse.json({ error: 'Valid test_email is required' }, { status: 400 });
    }

    const dummyCompany: Partial<CompanyRecipient> = sample_company || {
      corporate_number: '1010001000001',
      company_name: '【テスト送信】株式会社サンプル',
      representative_name: '代表 太郎',
      email_address: test_email,
      prefecture_name: '東京都',
      city_name: '千代田区',
      website_url: 'https://kigyoulist.com',
    };

    const unsubscribeUrl = buildUnsubscribeUrl(test_email);
    const renderedSubject = `[TEST] ${renderTemplate(subject || '【Kigyou-List】テスト配信', dummyCompany, unsubscribeUrl)}`;
    const renderedHtml = renderTemplate(body_html || '', dummyCompany, unsubscribeUrl);

    const result = await sendEmailViaResend({
      to: test_email,
      subject: renderedSubject,
      html: renderedHtml,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${test_email}`,
      resend_id: result.id,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/send-test POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
