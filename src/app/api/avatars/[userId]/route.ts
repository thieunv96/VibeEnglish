import fs from "node:fs";
import { NextResponse } from "next/server";
import { avatarPath, isSafeUserId } from "@/lib/avatar-server";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { userId } = await params;
  if (!isSafeUserId(userId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const file = avatarPath(userId);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const bytes = fs.readFileSync(file);
  // Use the underlying ArrayBuffer slice to satisfy the Response BodyInit type.
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(ab, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Length": String(bytes.byteLength),
    },
  });
}
