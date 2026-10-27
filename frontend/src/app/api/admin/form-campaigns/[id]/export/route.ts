import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { Pool } from 'pg';
import { runQuery } from '@/lib/db';

const DATABASE_URL = process.env.DATABASE_URL;
let pgPool: Pool | null = null;
function getPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({ connectionString: DATABASE_URL, max: 5 });
  }
  return pgPool;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // 1. Fetch Campaign Info
    const campRows = await runQuery(`SELECT * FROM user_form_campaigns WHERE id = ?`, [id]);
    if (!campRows || campRows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const camp = campRows[0];

    // 2. Fetch Detailed Send Logs
    let sendLogs: any[] = [];
    try {
      const logsSql = `
        SELECT corporate_number, company_name, prefecture_name, website_url, form_url, status, message, sent_at
        FROM internal_form_send_logs 
        WHERE campaign_id = ? 
        ORDER BY sent_at ASC
      `;
      sendLogs = await runQuery(logsSql, [id]);
    } catch (e) {
      console.warn("Could not query internal_form_send_logs:", e);
    }

    // 3. Construct CSV Content
    const headers = [
      '法人番号(Corporate Number)',
      '企業名(Company Name)',
      '都道府県(Prefecture)',
      '公式URL(Website URL)',
      '問い合わせフォームURL(Contact Form URL)',
      '送信ステータス(Send Status)',
      '結果詳細・スキップ理由(Detail Message)',
      '送信日時(Sent At)'
    ];

    const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')];

    if (sendLogs && sendLogs.length > 0) {
      for (const log of sendLogs) {
        const row = [
          log.corporate_number || '',
          log.company_name || '',
          log.prefecture_name || '',
          log.website_url || '',
          log.form_url || '',
          log.status === 'success' || log.status === 'sent' ? '成功 (Success)' : 'スキップ/未達 (Skipped/Failed)',
          log.message || '',
          log.sent_at ? new Date(log.sent_at).toISOString().replace('T', ' ').substring(0, 19) : ''
        ];
        csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      }
    } else {
      // Summary fallback row if individual logs were pruned
      csvRows.push([
        `"TARGET_TOTAL_${camp.target_count}"`,
        `"${(camp.name || '').replace(/"/g, '""')}"`,
        '""',
        `"${camp.sender_website || ''}"`,
        '""',
        `"送信完了: ${camp.success_count || 0}件 / スキップ: ${camp.skipped_count || 0}件"`,
        `"ステータス: ${camp.status}"`,
        `"${new Date(camp.created_at).toISOString().replace('T', ' ').substring(0, 19)}"`
      ].join(','));
    }

    const csvBody = '\uFEFF' + csvRows.join('\r\n');

    return new Response(csvBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="form_campaign_${id}_report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/admin/form-campaigns/[id]/export:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
