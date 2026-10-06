import { NextResponse } from 'next/server';
import { verifyUnsubscribeToken, addSuppression } from '@/lib/marketing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: '無効なメールアドレスです。' }, { status: 400 });
    }

    // If token provided, verify it. If valid or direct user request, register suppression.
    if (token) {
      const isValid = verifyUnsubscribeToken(email, token);
      if (!isValid) {
        return NextResponse.json({ error: '無効または期限切れのリンクです。' }, { status: 400 });
      }
    }

    await addSuppression(email, 'user_unsubscribe');

    return NextResponse.json({
      success: true,
      message: '配信停止の手続きが完了いたしました。',
    });
  } catch (error: any) {
    console.error('Error in /api/marketing/unsubscribe POST:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
