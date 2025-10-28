import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const filesetIdParam = url.searchParams.get("filesetId");
  const mime = url.searchParams.get("mime");

  const where: NonNullable<Parameters<typeof prisma.file.findMany>[0]>["where"] = {};

  // Text search on originalName or description
  if (q) {
    where.OR = [
      { originalName: { contains: q } },
      { description: { contains: q } },
    ];
  }

  // Filter by fileset
  if (filesetIdParam) {
    const filesetId = Number(filesetIdParam);
    if (!Number.isNaN(filesetId)) {
      where.filesetId = filesetId;
    }
  }

  // Filter by MIME
  if (mime) {
    where.mimeType = mime;
  }

  // Visibility for unauthenticated users: only public file sets
  if (!session?.user) {
    where.fileSet = { visibility: "public" } as any;
  }

  const items = await prisma.file.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      filename: true,
      originalName: true,
      description: true,
      size: true,
      mimeType: true,
      filesetId: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 50,
  });
  return NextResponse.json({ items });
}
