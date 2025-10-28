import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { persistFile, deleteFileAsset, getPublicFileUrl } from "@/lib/storage";

/**
 * GET /api/files - List files in a fileset
 */
export async function GET(req: Request) {
  try {
    const authCheck = await requireAuth();
    if ("error" in authCheck) return authCheck.error;
    const session = authCheck.session;
    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";

    const url = new URL(req.url);
    const filesetId = url.searchParams.get("filesetId");
    const q = url.searchParams.get("q");

    if (!filesetId) {
      return NextResponse.json({ message: "缺少 filesetId" }, { status: 400 });
    }

    // Check fileset access permission
    const fileset = await prisma.fileSet.findUnique({
      where: { id: Number(filesetId) },
      select: { id: true, visibility: true, createdBy: true },
    });

    if (!fileset) {
      return NextResponse.json({ message: "文件集不存在" }, { status: 404 });
    }

    const canView =
      isAdmin ||
      fileset.visibility === "public" ||
      fileset.visibility === "internal" ||
      fileset.createdBy === userId;

    if (!canView) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    const where: any = { filesetId: Number(filesetId) };
    if (q) where.originalName = { contains: q };

    const items = await prisma.file.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        originalName: true,
        description: true,
        mimeType: true,
        size: true,
        uploaderId: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 100,
    });

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        url: getPublicFileUrl(item.filename),
      })),
    });
  } catch (e: any) {
    console.error("[GET /api/files]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ items: [], message: "文件列表暂不可用" }, { status: 500 });
  }
}

/**
 * POST /api/files - Upload a file
 * Uses multipart/form-data
 */
export async function POST(req: Request) {
  try {
    const authCheck = await requireAuth();
    if ("error" in authCheck) return authCheck.error;
    const session = authCheck.session;
    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const filesetIdStr = formData.get("filesetId") as string | null;
    const description = (formData.get("description") as string | null) || undefined;

    if (!file || !filesetIdStr) {
      return NextResponse.json({ message: "缺少文件或文件集ID" }, { status: 400 });
    }

    const filesetId = Number(filesetIdStr);

    // Check fileset exists and has permission
    const fileset = await prisma.fileSet.findUnique({
      where: { id: filesetId },
      select: { id: true, visibility: true, createdBy: true },
    });

    if (!fileset) {
      return NextResponse.json({ message: "文件集不存在" }, { status: 404 });
    }

    // Only admin or members can upload to private fileset
    // Internal/public filesets allow all authenticated users
    const canUpload =
      isAdmin ||
      fileset.createdBy === userId ||
      fileset.visibility === "internal" ||
      fileset.visibility === "public";

    if (!canUpload) {
      return NextResponse.json({ message: "无权限上传" }, { status: 403 });
    }

    // Upload file to storage
    const { filename, originalName } = await persistFile(file);

    // Create file record
    const created = await prisma.file.create({
      data: {
        filename,
        originalName,
        description,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        filesetId,
        uploaderId: userId,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        description: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      item: {
        ...created,
        url: getPublicFileUrl(created.filename),
      },
    }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/files]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (e?.name === "UploadError") {
      return NextResponse.json({ message: e.message }, { status: e.statusCode || 400 });
    }
    return NextResponse.json({ message: "上传失败" }, { status: 500 });
  }
}
