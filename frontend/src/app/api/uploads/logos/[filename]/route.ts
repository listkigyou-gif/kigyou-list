import { NextRequest, NextResponse } from "next/server";
import { getFileFromR2 } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename) {
      return new Response("Filename is required", { status: 400 });
    }

    const key = `uploads/logos/${filename}`;
    const fileBuffer = await getFileFromR2(key);

    if (!fileBuffer) {
      return new Response("File not found", { status: 404 });
    }

    // Determine content type based on extension
    let contentType = "image/png";
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "svg") {
      contentType = "image/svg+xml";
    } else if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    }

    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving logo from R2:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
