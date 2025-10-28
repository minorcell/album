import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { deleteFileAsset } from "@/lib/storage";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(["private", "internal", "public"]).optional(),
});

/**
 * GET /api/filesets/:id - Get single fileset details
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (Number.isNaN(id)) return NextResponse.json({ message: "ID 错误" }, { status: 400 });

    const authCheck = await requireAuth();
    if (!authCheck.ok) return authCheck.error;
    const userId = Number(authCheck.session.user.id);
    const isAdmin = authCheck.session.user.role === "admin";

    const item = await prisma.fileSet.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        createdBy: true,
        _count: { select: { files: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!item) return NextResponse.json({ message: "未找到" }, { status: 404 });

    // Permission check: private (admin only), internal/public (authenticated), or creator
    const canView =
      isAdmin ||
      item.visibility === "public" ||
      item.visibility === "internal" ||
      item.createdBy === userId;

    if (!canView) return NextResponse.json({ message: "无权限" }, { status: 403 });

    return NextResponse.json({
      item: {
        ...item,
        fileCount: item._count.files,
      },
    });
  } catch (e: any) {
    console.error("[GET /api/filesets/:id]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ message: "获取失败" }, { status: 500 });
  }
}

/**
 * PUT /api/filesets/:id - Update fileset (admin only)
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (Number.isNaN(id)) return NextResponse.json({ message: "ID 错误" }, { status: 400 });

    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) return adminCheck.error;

    const body = await req.json().catch(() => undefined);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.fileSet.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (e: any) {
    console.error("[PUT /api/filesets/:id]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (e?.message === "Forbidden") {
      return NextResponse.json({ message: "仅管理员可更新文件集" }, { status: 403 });
    }
    return NextResponse.json({ message: "更新失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/filesets/:id - Delete fileset with all its files (admin only)
 */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (Number.isNaN(id)) return NextResponse.json({ message: "ID 错误" }, { status: 400 });

    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) return adminCheck.error;

    // Get all files in this fileset to delete from storage
    const files = await prisma.file.findMany({
      where: { filesetId: id },
      select: { filename: true },
    });

    // Delete from storage (best effort)
    await Promise.allSettled(files.map((f) => deleteFileAsset(f.filename)));

    // Delete fileset (cascade will delete all file records)
    await prisma.fileSet.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[DELETE /api/filesets/:id]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (e?.message === "Forbidden") {
      return NextResponse.json({ message: "仅管理员可删除文件集" }, { status: 403 });
    }
    return NextResponse.json({ message: "删除失败" }, { status: 500 });
  }
}
