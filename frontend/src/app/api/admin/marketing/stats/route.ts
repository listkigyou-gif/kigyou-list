import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { getMarketingStats, BUILTIN_TEMPLATES } from '@/lib/marketing';

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';

    const stats = await getMarketingStats(forceRefresh);
    return NextResponse.json({
      success: true,
      stats,
      templates: BUILTIN_TEMPLATES,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/stats GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
