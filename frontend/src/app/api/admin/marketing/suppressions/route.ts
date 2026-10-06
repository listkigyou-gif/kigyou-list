import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { getSuppressions, addSuppression, removeSuppression } from '@/lib/marketing';

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const data = await getSuppressions(limit, offset);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/suppressions GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { email, reason = 'manual_admin' } = body;
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    await addSuppression(email, reason);
    return NextResponse.json({ success: true, message: `Added ${email} to suppressions` });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/suppressions POST:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    await removeSuppression(email);
    return NextResponse.json({ success: true, message: `Removed ${email} from suppressions` });
  } catch (error: any) {
    console.error('Error in /api/admin/marketing/suppressions DELETE:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
