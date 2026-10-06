import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { isAdmin } from '@/lib/adminAuth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          r.id,
          r.corporate_number,
          COALESCE(r.company_name, c.company_name, '企業名未取得') AS company_name,
          c.website_url,
          c.phone_number AS company_phone,
          r.user_email,
          r.applicant_name,
          r.applicant_phone,
          r.department,
          r.document_type,
          r.document_url,
          r.notes,
          r.status,
          r.reviewed_by,
          r.reviewed_at,
          r.rejection_reason,
          r.created_at
        FROM company_claim_requests r
        LEFT JOIN companies c ON r.corporate_number = c.corporate_number
      `;

      const params: any[] = [];
      if (statusFilter !== 'all') {
        query += ` WHERE r.status = $1`;
        params.push(statusFilter);
      }

      query += ` ORDER BY r.created_at DESC LIMIT 100`;

      const res = await client.query(query, params);
      return NextResponse.json({ success: true, claims: res.rows });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error in /api/admin/claims GET:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
