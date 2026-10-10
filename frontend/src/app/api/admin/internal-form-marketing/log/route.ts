import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { recordInternalFormSendLog } from '@/lib/internalFormMarketing';

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      campaign_id,
      corporate_number,
      company_name,
      form_url,
      prefecture_name,
      website_url,
      status,
      message,
    } = body;

    if (!campaign_id || !form_url || !status) {
      return NextResponse.json({ error: 'campaign_id, form_url, and status are required' }, { status: 400 });
    }

    await recordInternalFormSendLog({
      campaign_id,
      corporate_number,
      company_name,
      form_url,
      prefecture_name,
      website_url,
      status,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in record log route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
