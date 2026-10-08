import { NextResponse } from "next/server";
import { getExportJobById } from "@/lib/db";
import { getFileFromR2 } from "@/lib/r2";
import { isAdmin, isAdminEmail } from "@/lib/adminAuth";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("jobId");
    let email = searchParams.get("email");

    const session = await auth();
    if (!email && session?.user?.email) {
      email = session.user.email;
    }

    if (!id) {
      return NextResponse.json({ error: "Missing required parameter: id or jobId" }, { status: 400 });
    }

    const job = await getExportJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Export job not found" }, { status: 404 });
    }

    // Verify ownership: requester must be logged in with matching email, or is admin
    let isRequesterAdmin = isAdmin(request);

    if (session && session.user && session.user.email) {
      const sessionEmail = session.user.email.toLowerCase();
      if (isAdminEmail(sessionEmail)) {
        isRequesterAdmin = true;
      }
    }

    const jobOwnerEmail = job.user_email.toLowerCase();
    const currentRequesterEmail = (email || session?.user?.email || "").toLowerCase();

    if (!isRequesterAdmin && (!currentRequesterEmail || currentRequesterEmail !== jobOwnerEmail)) {
      return NextResponse.json({ error: "Unauthorized access to download" }, { status: 403 });
    }

    if (!job.file_path) {
      return new Response(
        "<html><head><title>Expired</title></head><body style='font-family: sans-serif; padding: 40px; text-align: center;'><h2 style='color: #e53e3e;'>ダウンロードの有効期限切れ (Expired)</h2><p>このファイルの保存期間（7日間）が経過したため、自動的に削除されました。再度エクスポートを実行してください。</p></body></html>", 
        {
          status: 410,
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        }
      );
    }

    // Extract storage key from file_path (remove r2:// or local://)
    const key = job.file_path.replace(/^(r2:\/\/|local:\/\/)/, "");
    
    const fileBuffer = await getFileFromR2(key);
    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="kigyou_list_${id}.zip"`,
      },
    });

  } catch (error) {
    console.error("Error in /api/export/download route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
