import { NextResponse } from "next/server";
import { getBackupLogs, initBackupLogsTable } from "@/lib/db";
import { isAdmin } from "@/lib/adminAuth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await initBackupLogsTable();
    const backups = await getBackupLogs();
    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error("Error in /api/admin/backups GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await initBackupLogsTable();
    const scriptPath = path.resolve(process.cwd(), "../scripts/db_backup.sh");
    
    // Determine command based on platform
    const command = process.platform === "win32" 
      ? `bash "${scriptPath}"` 
      : `/bin/bash "${scriptPath}"`;

    console.log(`Executing manual backup script: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command);
      console.log("Backup script output:", stdout);
      if (stderr) {
        console.warn("Backup script stderr:", stderr);
      }
      
      // Fetch latest logs after execution
      const backups = await getBackupLogs();
      return NextResponse.json({ 
        success: true, 
        message: "Manual backup executed successfully",
        backups
      });
    } catch (execError: any) {
      console.error("Backup script execution failed:", execError);
      
      // Fetch logs anyway (the script might have inserted a failed log record)
      const backups = await getBackupLogs();
      return NextResponse.json({ 
        error: "Backup execution failed", 
        details: execError.message,
        backups
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in /api/admin/backups POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
