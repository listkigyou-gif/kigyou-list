import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { 
  createInternalFormCampaign, 
  getInternalFormCampaigns, 
  countFormTargetAudience 
} from '@/lib/internalFormMarketing';

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getInternalFormCampaigns(limit, offset);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/internal-form-marketing/campaigns GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      sender_company,
      sender_name,
      sender_furigana,
      sender_email,
      sender_phone,
      sender_website,
      subject,
      message_body,
      target_filters,
      execution_mode,
    } = body;

    if (!name || !sender_company || !sender_name || !sender_email || !subject || !message_body) {
      return NextResponse.json(
        { error: 'Missing required campaign fields (name, sender_company, sender_name, sender_email, subject, message_body)' },
        { status: 400 }
      );
    }

    const total_targeted = await countFormTargetAudience(target_filters || {});

    const campaign = await createInternalFormCampaign({
      name,
      sender_company,
      sender_name,
      sender_furigana,
      sender_email,
      sender_phone,
      sender_website,
      subject,
      message_body,
      target_filters: target_filters || {},
      total_targeted,
      execution_mode: execution_mode || 'local_warp',
    });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/internal-form-marketing/campaigns POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
