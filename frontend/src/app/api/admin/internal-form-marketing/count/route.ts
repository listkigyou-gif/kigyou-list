import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { countFormTargetAudience } from '@/lib/internalFormMarketing';

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const count = await countFormTargetAudience(body.filters || {});

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/internal-form-marketing/count POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
