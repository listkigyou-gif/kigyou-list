import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
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
    const client = await pool.connect();

    try {
      // Get campaign
      const campRes = await client.query(`SELECT * FROM internal_form_campaigns WHERE id = $1`, [id]);
      if (campRes.rows.length === 0) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      const campaign = campRes.rows[0];

      // Get all logs for this campaign
      const logsRes = await client.query(
        `SELECT * FROM internal_form_send_logs WHERE campaign_id = $1 ORDER BY sent_at ASC`,
        [id]
      );

      // Build CSV
      const headers = [
        '法人番号(Corporate Number)',
        '企業名(Company Name)',
        '都道府県(Prefecture)',
        '公式Webサイト(Website URL)',
        '問い合わせフォームURL(Contact Form URL)',
        '送信結果ステータス(Status)',
        '詳細メッセージ・スキップ理由(Detail Reason / Message)',
        '送信日時(Sent At)'
      ];

      const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')];

      for (const log of logsRes.rows) {
        const row = [
          log.corporate_number || '',
          log.company_name || '',
          log.prefecture_name || '',
          log.website_url || '',
          log.form_url || '',
          log.status || '',
          log.message || '',
          log.sent_at ? new Date(log.sent_at).toISOString().replace('T', ' ').substring(0, 19) : ''
        ];
        csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      }

      // Add UTF-8 BOM (\uFEFF)
      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      const filename = `form_dm_report_${campaign.name.replace(/[^a-zA-Z0-9_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g, '_')}_${id.substring(0, 8)}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'no-store',
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error in export CSV route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
