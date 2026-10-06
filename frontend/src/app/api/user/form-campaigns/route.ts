import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getUserCampaigns, 
  saveUserCampaign, 
  deleteUserCampaign 
} from "@/lib/formCampaigns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email || request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await getUserCampaigns(email);

    return NextResponse.json({
      success: true,
      campaigns
    });
  } catch (err: any) {
    console.error("Error in GET /api/user/form-campaigns:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email || request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      id,
      name,
      template_id,
      sender_company,
      sender_name,
      sender_email,
      sender_phone,
      sender_website,
      subject,
      body: pitchBody,
      target_filters,
      target_count,
      cost_jpy,
      status
    } = body;

    if (!name || !sender_company || !sender_name || !subject || !pitchBody) {
      return NextResponse.json({ error: "Required fields missing." }, { status: 400 });
    }

    const saved = await saveUserCampaign(email, {
      id,
      name,
      template_id,
      sender_company,
      sender_name,
      sender_email: sender_email || email,
      sender_phone,
      sender_website,
      subject,
      body: pitchBody,
      target_filters,
      target_count: target_count || 0,
      cost_jpy: cost_jpy || 0,
      status: status || 'draft'
    });

    return NextResponse.json({ success: true, campaign: saved });
  } catch (err: any) {
    console.error("Error in POST /api/user/form-campaigns:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email || request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required." }, { status: 400 });
    }

    const deleted = await deleteUserCampaign(email, id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error("Error in DELETE /api/user/form-campaigns:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
