import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { getInternalFormMarketingStats, INTERNAL_CAMPAIGN_PRESETS } from '@/lib/internalFormMarketing';

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const stats = await getInternalFormMarketingStats();
    return NextResponse.json({
      success: true,
      stats,
      preset_templates: INTERNAL_CAMPAIGN_PRESETS,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/internal-form-marketing/stats GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
