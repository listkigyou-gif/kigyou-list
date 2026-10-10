import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { getFormTargetAudienceBatch } from '@/lib/internalFormMarketing';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const client = await pool.connect();
    let campaign = null;
    try {
      const campRes = await client.query(`SELECT * FROM internal_form_campaigns WHERE id = $1`, [id]);
      if (campRes.rows.length === 0) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      campaign = campRes.rows[0];
    } finally {
      client.release();
    }

    const targets = await getFormTargetAudienceBatch(campaign.target_filters || {}, limit, offset);

    return NextResponse.json({
      success: true,
      campaign,
      targets,
    });
  } catch (error: any) {
    console.error('Error in campaign targets route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
