import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getUserTemplates, 
  saveUserTemplate, 
  deleteUserTemplate, 
  PRESET_TEMPLATES 
} from "@/lib/formCampaigns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email || request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTemplates = await getUserTemplates(email);

    return NextResponse.json({
      success: true,
      presets: PRESET_TEMPLATES,
      templates: userTemplates
    });
  } catch (err: any) {
    console.error("Error in GET /api/user/form-templates:", err);
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
    const { id, name, category, subject, body: templateBody } = body;
    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: "Name, subject, and body are required." }, { status: 400 });
    }

    const saved = await saveUserTemplate(email, {
      id,
      name,
      category,
      subject,
      body: templateBody
    });

    return NextResponse.json({ success: true, template: saved });
  } catch (err: any) {
    console.error("Error in POST /api/user/form-templates:", err);
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
      return NextResponse.json({ error: "Template ID is required." }, { status: 400 });
    }

    const deleted = await deleteUserTemplate(email, id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error("Error in DELETE /api/user/form-templates:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
