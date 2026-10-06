import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserClaimedCompanies, getUserClaimRequests, isUserVerifiedBusinessPartner } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    const session = await auth();
    const userEmail = session?.user?.email || emailParam;

    if (!userEmail) {
      return NextResponse.json({ error: '認証が必要です。ログインしてください。' }, { status: 401 });
    }

    const [companies, claimRequests, isVerifiedPartner] = await Promise.all([
      getUserClaimedCompanies(userEmail),
      getUserClaimRequests(userEmail),
      isUserVerifiedBusinessPartner(userEmail),
    ]);

    return NextResponse.json({
      success: true,
      user_email: userEmail,
      is_verified_partner: isVerifiedPartner,
      daily_allowance: isVerifiedPartner ? 50 : 20,
      companies,
      claim_requests: claimRequests,
    });
  } catch (error: any) {
    console.error('Error in /api/user/companies GET:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
