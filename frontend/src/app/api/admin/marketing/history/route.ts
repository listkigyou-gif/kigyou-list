import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { getCampaignsList, getCampaignSendLogs } from '@/lib/marketing';

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (campaignId) {
      const logs = await getCampaignSendLogs(campaignId, limit);
      return NextResponse.json({ success: true, logs });
    }

    const data = await getCampaignsList(limit, offset);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/history GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
