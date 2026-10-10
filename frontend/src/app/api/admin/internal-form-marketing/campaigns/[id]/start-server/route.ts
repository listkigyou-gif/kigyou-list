import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { Pool } from 'pg';
import { spawn } from 'child_process';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === 'number' ? body.limit : 50;
    const concurrency = typeof body.concurrency === 'number' ? body.concurrency : 3;
    const isLive = body.live !== false; // default to true (live)

    const client = await pool.connect();
    let campaign = null;
    try {
      const campRes = await client.query(
        `SELECT * FROM internal_form_campaigns WHERE id = $1`,
        [id]
      );
      if (campRes.rows.length === 0) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      campaign = campRes.rows[0];

      // Mark status as processing
      await client.query(
        `UPDATE internal_form_campaigns SET status = 'processing', started_at = COALESCE(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
    } finally {
      client.release();
    }

    // Spawn server_worker.py in detached background mode
    const rootDir = path.resolve(process.cwd(), '..');
    const scriptPath = path.join(rootDir, 'scripts', 'form_dispatcher', 'server_worker.py');
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

    const args = [
      scriptPath,
      '--campaign-id',
      id,
      '--limit',
      String(limit),
      '--concurrency',
      String(concurrency),
    ];
    if (isLive) {
      args.push('--live');
    }

    try {
      const workerProcess = spawn(pythonExe, args, {
        cwd: rootDir,
        detached: true,
        stdio: 'ignore',
      });
      workerProcess.unref();
    } catch (spawnErr: any) {
      console.warn('Could not spawn background worker process directly:', spawnErr?.message);
      // Even if spawn fails, the campaign is marked processing so an active daemon can pick it up
    }

    return NextResponse.json({
      success: true,
      message: 'Server worker has been initiated.',
      campaign_id: id,
      limit,
      concurrency,
      live: isLive,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/internal-form-marketing/campaigns/[id]/start-server POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
