import { NextResponse } from "next/server";
import { z } from "zod";
import JSZip from "jszip";

import { Prisma, CategoryVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guards";
import { auth } from "@/lib/auth";
import {
  ConfigurationError,
  deleteImageAssets,
  getOriginalBuffer,
  getPublicObjectUrl,
  getPublicThumbnailUrl,
  isNotFoundError,
} from "@/lib/storage";

const idArraySchema = z.array(z.number().int().positive()).min(1);

const deleteSchema = z.object({
  ids: idArraySchema,
});

const downloadSchema = z.object({
  ids: idArraySchema,
});

const renameSchema = z.object({
  id: z.number().int().positive(),
  description: z
    .string()
    .max(300)
    .transform((value) => value.trim())
    .optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryIdParam = searchParams.get("categoryId");
  const pageParam = searchParams.get("page") ?? "1";
  const pageSizeParam = searchParams.get("pageSize") ?? "24";

  const page = Math.max(Number.parseInt(pageParam, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(pageSizeParam, 10) || 24, 1), 96);

  const session = await auth();
  const internalVisibilities: CategoryVisibility[] = [CategoryVisibility.internal, CategoryVisibility.public];
  const visibilityFilter: Prisma.PhotoWhereInput = !session?.user
    ? { category: { visibility: CategoryVisibility.public } }
    : session.user.role === "admin"
      ? {}
      : { category: { visibility: { in: internalVisibilities } } };

  const parsedCategoryId = categoryIdParam ? Number.parseInt(categoryIdParam, 10) : undefined;
  const where: Prisma.PhotoWhereInput = {
    ...(Number.isInteger(parsedCategoryId) ? { categoryId: parsedCategoryId } : {}),
    ...visibilityFilter,
  };

  const photos = await prisma.photo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      uploader: {
        select: { username: true },
      },
      category: {
        select: { name: true },
      },
    },
  });

  const total = await prisma.photo.count({ where });

  try {
    return NextResponse.json({
      data: photos.map((photo) => ({
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        description: photo.description,
        createdAt: photo.createdAt,
        uploader: photo.uploader.username,
        category: photo.category.name,
        fileUrl: getPublicObjectUrl(photo.filename),
        thumbnailUrl: getPublicThumbnailUrl(photo.filename),
      })),
      meta: {
        page,
        pageSize,
        total,
      },
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(error);
      return NextResponse.json({ error: "对象存储配置错误" }, { status: 500 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const authCheck = await requireAuth();
  if ("error" in authCheck) return authCheck.error;

  const body = await request.json().catch(() => null);
  const parsed = downloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const photos = await prisma.photo.findMany({
    where: { id: { in: parsed.data.ids } },
    select: {
      id: true,
      filename: true,
      originalName: true,
    },
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  const zip = new JSZip();
  let addedCount = 0;

  try {
    for (const photo of photos) {
      try {
        const fileBuffer = await getOriginalBuffer(photo.filename);
        const name = photo.originalName || photo.filename;
        zip.file(name, fileBuffer);
        addedCount += 1;
      } catch (error) {
        if (isNotFoundError(error)) {
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(error);
      return NextResponse.json({ error: "对象存储配置错误" }, { status: 500 });
    }
    throw error;
  }

  if (addedCount === 0) {
    return NextResponse.json({ error: "图片文件不存在" }, { status: 404 });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const zipArrayBuffer = new ArrayBuffer(zipBuffer.byteLength);
  const zipView = new Uint8Array(zipArrayBuffer);
  zipView.set(new Uint8Array(zipBuffer.buffer, zipBuffer.byteOffset, zipBuffer.byteLength));

  const response = new Response(zipArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=photos-${Date.now()}.zip`,
    },
  });

  return response;
}

export async function DELETE(request: Request) {
  const authCheck = await requireAuth();
  if ("error" in authCheck) return authCheck.error;

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const targetPhotos = await prisma.photo.findMany({
    where: { id: { in: parsed.data.ids } },
    select: { id: true, filename: true, uploaderId: true },
  });

  if (targetPhotos.length === 0) {
    return NextResponse.json({ deleted: 0 }, { status: 200 });
  }

  const requesterId = Number.parseInt(authCheck.session.user!.id, 10);
  if (Number.isNaN(requesterId)) {
    return NextResponse.json({ error: "用户信息异常" }, { status: 400 });
  }

  const isAdmin = authCheck.session.user?.role === "admin";
  const unauthorized = targetPhotos.filter((photo) => photo.uploaderId !== requesterId && !isAdmin);
  if (unauthorized.length > 0) {
    return NextResponse.json({ error: "仅可操作自己上传的照片" }, { status: 403 });
  }

  await prisma.photo.deleteMany({ where: { id: { in: targetPhotos.map((photo) => photo.id) } } });

  try {
    await Promise.all(targetPhotos.map((photo) => deleteImageAssets(photo.filename)));
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(error);
      return NextResponse.json({ error: "对象存储配置错误" }, { status: 500 });
    }
    throw error;
  }

  return NextResponse.json({ deleted: targetPhotos.length });
}

export async function PATCH(request: Request) {
  const authCheck = await requireAuth();
  if ("error" in authCheck) return authCheck.error;

  const body = await request.json().catch(() => null);
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, uploaderId: true },
  });

  if (!photo) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  const requesterId = Number.parseInt(authCheck.session.user!.id, 10);
  if (Number.isNaN(requesterId)) {
    return NextResponse.json({ error: "用户信息异常" }, { status: 400 });
  }

  const isAdmin = authCheck.session.user?.role === "admin";
  if (!isAdmin && photo.uploaderId !== requesterId) {
    return NextResponse.json({ error: "仅可操作自己上传的照片" }, { status: 403 });
  }

  const updated = await prisma.photo.update({
    where: { id: parsed.data.id },
    data: {
      description: parsed.data.description && parsed.data.description.length > 0 ? parsed.data.description : null,
    },
    select: {
      id: true,
      filename: true,
      originalName: true,
      description: true,
      createdAt: true,
      uploader: { select: { username: true } },
      category: { select: { name: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    filename: updated.filename,
    originalName: updated.originalName,
    description: updated.description,
    createdAt: updated.createdAt,
    uploader: updated.uploader.username,
    category: updated.category.name,
  });
}
