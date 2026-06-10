import { NextResponse } from "next/server";
import { getUserQuota, getExportJobs } from "@/lib/db";
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

    const quota = await getUserQuota(email);
    const isFreePlan = (quota.plan === 'free');
    const remaining = (quota.monthly_base_allowance - quota.monthly_base_used) + (isFreePlan ? 0 : quota.purchased_add_on_balance);
    
    const history = await getExportJobs(email);

    return NextResponse.json({
      quota: {
        ...quota,
        remaining: Math.max(0, remaining)
      },
      history
    });
  } catch (error) {
    console.error("Error in /api/export/quota-check route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
