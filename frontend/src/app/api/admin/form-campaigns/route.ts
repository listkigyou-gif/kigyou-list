import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { 
  getAdminFormCampaigns, 
  adminUpdateCampaignStatus 
} from "@/lib/formCampaigns";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const campaigns = await getAdminFormCampaigns(status);
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    console.error("Error in GET /api/admin/form-campaigns:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { campaignId, action, rejectionReason } = body;

    if (!campaignId || !["approve", "reject", "complete"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const statusMap: Record<string, "approved" | "rejected" | "completed"> = {
      approve: "approved",
      reject: "rejected",
      complete: "completed"
    };

    const updated = await adminUpdateCampaignStatus(
      campaignId,
      statusMap[action],
      rejectionReason
    );

    return NextResponse.json({ success: updated, status: statusMap[action] });
  } catch (err: any) {
    console.error("Error in POST /api/admin/form-campaigns:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
