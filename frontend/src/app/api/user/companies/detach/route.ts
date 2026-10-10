import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Pool } from 'pg';
import { invalidateCompanyCache } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const session = await auth();
    const body = await request.json();
    const { corporate_number, user_email: targetEmail } = body;

    const email = session?.user?.email || targetEmail;
    if (!email) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    if (!corporate_number) {
      return NextResponse.json({ error: '法人番号（corporate_number）が指定されていません。' }, { status: 400 });
    }

    // 1. Delete relationship from user_companies
    const deleteRes = await client.query(
      `DELETE FROM user_companies 
       WHERE LOWER(user_email) = LOWER($1) AND corporate_number = $2
       RETURNING *`,
      [email.trim(), corporate_number.trim()]
    );

    // 2. Clear claimed_by if it was claimed by this email
    await client.query(
      `UPDATE companies 
       SET claimed_by_email = NULL, claimed_by_name = NULL, is_claimed = FALSE, updated_at = NOW()
       WHERE corporate_number = $1 AND LOWER(claimed_by_email) = LOWER($2)`,
      [corporate_number.trim(), email.trim()]
    );

    invalidateCompanyCache(corporate_number.trim());
    try {
      revalidatePath(`/[locale]/company/${corporate_number}`, 'page');
      revalidatePath(`/ja/company/${corporate_number}`);
    } catch (ignore) {}

    return NextResponse.json({
      success: true,
      message: '管理企業リストから紐付けを解除しました。',
      deleted_count: deleteRes.rowCount,
    });
  } catch (error: any) {
    console.error('Error in /api/user/companies/detach POST:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
