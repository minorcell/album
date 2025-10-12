import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import {
  ConfigurationError,
  getPublicObjectUrl,
  getPublicThumbnailUrl,
  persistImage,
  UploadError,
} from "@/lib/storage";

const uploadSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  description: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const authCheck = await requireAuth();
  if ("error" in authCheck) {
    return authCheck.error;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少上传文件" }, { status: 400 });
  }

  const parsed = uploadSchema.safeParse({
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true, visibility: true },
  });
  if (!category) {
    return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  }

  const isAdmin = authCheck.session.user?.role === "admin";
  if (category.visibility === "private" && !isAdmin) {
    return NextResponse.json({ error: "无权在该分类上传" }, { status: 403 });
  }

  const uploaderId = Number.parseInt(authCheck.session.user!.id, 10);
  if (Number.isNaN(uploaderId)) {
    return NextResponse.json({ error: "用户信息异常" }, { status: 400 });
  }

  try {
    const { filename, originalName } = await persistImage(file);

    const photo = await prisma.photo.create({
      data: {
        filename,
        originalName,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        uploaderId,
      },
      include: {
        uploader: { select: { username: true } },
      },
    });

    return NextResponse.json({
      id: photo.id,
      filename: photo.filename,
      originalName: photo.originalName,
      description: photo.description,
      categoryId: photo.categoryId,
      uploader: photo.uploader.username,
      createdAt: photo.createdAt,
      fileUrl: getPublicObjectUrl(photo.filename),
      thumbnailUrl: getPublicThumbnailUrl(photo.filename),
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ConfigurationError) {
      console.error(error);
      return NextResponse.json({ error: "对象存储配置错误" }, { status: 500 });
    }
    console.error(error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
