import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { getPresignedInlineFileUrl } from "@/lib/storage";

/**
 * GET /api/files/inline-url?fileId=123
 * Returns a presigned URL with `content-disposition: inline` for previewing
 */
export async function GET(req: Request) {
  try {
    const authCheck = await requireAuth();
    if ("error" in authCheck) return authCheck.error;
    const session = authCheck.session;
    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";

    const url = new URL(req.url);
    const fileIdStr = url.searchParams.get("fileId");
    const fileId = fileIdStr ? Number(fileIdStr) : NaN;
    if (!fileIdStr || Number.isNaN(fileId)) {
      return NextResponse.json({ message: "缺少 fileId" }, { status: 400 });
    }

    // Fetch file and fileset to validate visibility
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        filesetId: true,
        fileSet: { select: { visibility: true, createdBy: true } },
      },
    });

    if (!file) {
      return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    }

    const canView =
      isAdmin ||
      file.fileSet.visibility === "public" ||
      file.fileSet.visibility === "internal" ||
      file.fileSet.createdBy === userId;

    if (!canView) {
      return NextResponse.json({ message: "无权限" }, { status: 403 });
    }

    const inlineUrl = await getPresignedInlineFileUrl(
      file.filename,
      file.originalName,
      file.mimeType || undefined,
    );
    return NextResponse.json({ url: inlineUrl });
  } catch (e: any) {
    console.error("[GET /api/files/inline-url]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ message: "生成预览链接失败" }, { status: 500 });
  }
}
