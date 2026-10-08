import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserFormCredits } from "@/lib/formCampaigns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email || request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credits = await getUserFormCredits(email);
    return NextResponse.json({
      success: true,
      credits
    });
  } catch (err: any) {
    console.error("Error in GET /api/user/form-credits:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
