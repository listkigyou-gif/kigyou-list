import { NextResponse } from "next/server";
import { getPaymentHistory } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const isRequesterAdmin = isAdmin(request);
    let email: string | null = null;

    if (isRequesterAdmin) {
      const { searchParams } = new URL(request.url);
      email = searchParams.get("email");
    } else {
      const session = await auth();
      if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      email = session.user.email;
    }
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const history = await getPaymentHistory(email);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error in /api/stripe/history GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
