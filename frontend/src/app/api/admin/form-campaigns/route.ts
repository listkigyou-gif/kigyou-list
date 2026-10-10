import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { 
  getAdminFormCampaigns, 
  adminUpdateCampaignStatus 
} from "@/lib/formCampaigns";

import { spawn } from "child_process";
import path from "path";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const queue = searchParams.get("queue");

    const campaigns = await getAdminFormCampaigns(status);

    if (queue === "local") {
      const localQueue = campaigns.filter(c => c.status === "approved" && c.runner_mode === "local");
      return NextResponse.json({ success: true, count: localQueue.length, campaigns: localQueue });
    }

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
    const { campaignId, action, rejectionReason, successCount, skippedCount, reportFileUrl, runnerMode } = body;

    if (!campaignId || !["approve", "reject", "complete", "processing"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const statusMap: Record<string, "approved" | "rejected" | "completed" | "processing"> = {
      approve: "approved",
      reject: "rejected",
      complete: "completed",
      processing: "processing"
    };

    const targetRunnerMode = runnerMode === "local" ? "local" : "server";

    const updated = await adminUpdateCampaignStatus(
      campaignId,
      statusMap[action],
      rejectionReason,
      {
        success_count: successCount,
        skipped_count: skippedCount,
        report_file_url: reportFileUrl,
        runner_mode: action === "approve" ? targetRunnerMode : undefined
      }
    );

    // If approved for server execution, trigger background campaign runner on server
    if (action === "approve" && targetRunnerMode === "server") {
      try {
        const rootDir = path.resolve(process.cwd(), "..");
        const scriptPath = path.join(rootDir, "scripts", "form_dispatcher", "campaign_runner.py");
        const pythonExe = process.platform === "win32" ? "python" : "python3";
        const workerProcess = spawn(pythonExe, [scriptPath, "--campaign-id", campaignId], {
          cwd: rootDir,
          detached: true,
          stdio: "ignore"
        });
        workerProcess.unref();
      } catch (spawnErr: any) {
        console.warn("Could not spawn background server worker directly:", spawnErr?.message);
      }
    }

    return NextResponse.json({ 
      success: updated, 
      status: statusMap[action],
      runner_mode: targetRunnerMode 
    });
  } catch (err: any) {
    console.error("Error in POST /api/admin/form-campaigns:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
