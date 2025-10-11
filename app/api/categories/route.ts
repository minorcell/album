import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { auth } from "@/lib/auth";
import { Prisma, CategoryVisibility } from "@prisma/client";

const categoryCreateSchema = z.object({
  name: z.string().min(1, "分类名称不能为空"),
  description: z.string().optional(),
  visibility: z.nativeEnum(CategoryVisibility).default(CategoryVisibility.internal),
});

const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z.number().int(),
});

const categoryDeleteSchema = z.object({
  id: z.number().int(),
});

export async function GET() {
  const session = await auth();
  const internalVisibilities: CategoryVisibility[] = [CategoryVisibility.internal, CategoryVisibility.public];
  const where: Prisma.CategoryWhereInput = !session?.user
    ? { visibility: CategoryVisibility.public }
    : session.user.role === "admin"
      ? {}
      : { visibility: { in: internalVisibilities } };

  const categories = await prisma.category.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { photos: true },
      },
    },
  });

  return NextResponse.json(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      photoCount: category._count.photos,
      visibility: category.visibility,
    })),
  );
}

export async function POST(request: Request) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  const body = await request.json().catch(() => null);
  const parseResult = categoryCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: parseResult.data.name,
      description: parseResult.data.description,
      visibility: parseResult.data.visibility,
    },
  });
  return NextResponse.json(category, { status: 201 });
}

export async function PUT(request: Request) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  const body = await request.json().catch(() => null);
  const parseResult = categoryUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const category = await prisma.category.update({
    where: { id: parseResult.data.id },
    data: {
      name: parseResult.data.name,
      description: parseResult.data.description,
      visibility: parseResult.data.visibility,
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(request: Request) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  const body = await request.json().catch(() => null);
  const parseResult = categoryDeleteSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  await prisma.category.delete({
    where: { id: parseResult.data.id },
  });
  return NextResponse.json({ success: true });
}
