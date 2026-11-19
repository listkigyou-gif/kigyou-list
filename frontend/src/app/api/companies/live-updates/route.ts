import { NextResponse } from 'next/server';
import { getLiveSyncFeed } from '@/lib/db';

export async function GET() {
  try {
    const feed = await getLiveSyncFeed(10);
    return NextResponse.json(feed, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/companies/live-updates:', error);
    return NextResponse.json(
      { today_count: 0, last_sync_at: new Date().toISOString(), items: [] },
      { status: 500 }
    );
  }
}
