import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const filesetId = url.searchParams.get("filesetId");
  const mime = url.searchParams.get("mime");

  const where: any = { deletedAt: null };
  if (q) where.name = { contains: q };
  if (filesetId) where.filesetId = Number(filesetId);
  if (mime) where.mimeType = mime;

  // 权限：公开或登录用户（后续细化成员）
  if (!session?.user) {
    where.fileSet = { visibility: "public" } as any;
  }

  const items = await prisma.file.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, size: true, mimeType: true, filesetId: true, folderId: true },
    take: 50,
  });
  return NextResponse.json({ items });
}
