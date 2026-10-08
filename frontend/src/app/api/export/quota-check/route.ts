import { NextResponse } from "next/server";
import { getUserQuota, getExportJobs } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";
import { auth } from "@/auth";
import { getUserFormCredits } from "@/lib/formCampaigns";

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

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("include_history") === "true";

    // Fast parallel execution; skip heavy export history unless requested
    const [quota, history, formCredits] = await Promise.all([
      getUserQuota(email),
      includeHistory ? getExportJobs(email) : Promise.resolve([]),
      getUserFormCredits(email).catch(() => ({ balance: 0, total_purchased: 0, total_used: 0 }))
    ]);

    const isFreePlan = (quota.plan === 'free');
    const remaining = (quota.monthly_base_allowance - quota.monthly_base_used) + (isFreePlan ? 0 : quota.purchased_add_on_balance);

    return NextResponse.json({
      quota: {
        ...quota,
        remaining: Math.max(0, remaining),
        form_credits_balance: formCredits ? formCredits.balance : 0
      },
      history
    });
  } catch (error) {
    console.error("Error in /api/export/quota-check route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
