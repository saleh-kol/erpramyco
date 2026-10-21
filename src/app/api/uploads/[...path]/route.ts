import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

// مخزن آپلود: بیرون از public و بیرون از .next → ماندگار در هر build
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

const MIME: Record<string, string> = {
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  xls:  "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc:  "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // فقط کاربر لاگین‌شده
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return new NextResponse("Unauthorized", { status: 401 });
  const user = await verifySession(token);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { path: segments } = await params;

  // گارد path traversal
  const filePath = path.join(UPLOADS_ROOT, ...segments);
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    const fileName = path.basename(filePath);
    const isDownload = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}