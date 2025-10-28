import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(["private", "internal", "public"]).default("internal"),
});

/**
 * GET /api/filesets - List all fileset visible to current user
 * Similar to category listing: private (admin only), internal (authenticated), public (all)
 */
export async function GET(req: Request) {
  try {
    const authCheck = await requireAuth();
    if (!authCheck.ok) return authCheck.error;
    const session = authCheck.session;
    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";

    // Visibility logic:
    // - private: admin only
    // - internal: all authenticated users
    // - public: everyone (but we require auth in this endpoint)
    const where = isAdmin
      ? {} // Admin sees all
      : {
          OR: [
            { visibility: "internal" as const },
            { visibility: "public" as const },
            { createdBy: userId },
          ],
        };

    const items = await prisma.fileSet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        _count: { select: { files: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        fileCount: item._count.files,
      })),
    });
  } catch (e) {
    console.error("[GET /api/filesets]", e);
    return NextResponse.json({ items: [], message: "文件集服务暂不可用" }, { status: 500 });
  }
}

/**
 * POST /api/filesets - Create new fileset (admin only)
 */
export async function POST(req: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) return adminCheck.error;
    const session = adminCheck.session;

    const body = await req.json().catch(() => undefined);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
    }

    const created = await prisma.fileSet.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        visibility: parsed.data.visibility,
        createdBy: Number(session.user.id),
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/filesets]", e);
    if (e?.message === "Unauthorized") {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (e?.message === "Forbidden") {
      return NextResponse.json({ message: "仅管理员可创建文件集" }, { status: 403 });
    }
    return NextResponse.json({ message: "创建失败" }, { status: 500 });
  }
}
