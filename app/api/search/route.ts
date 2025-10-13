import { NextResponse } from "next/server";
import { Prisma, CategoryVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getPublicObjectUrl, getPublicThumbnailUrl } from "@/lib/storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const categoryIdParam = searchParams.get("categoryId");
  const limitCategoriesParam = searchParams.get("limitCategories") ?? "10";
  const limitPhotosParam = searchParams.get("limitPhotos") ?? "20";

  const limitCategories = Math.min(Math.max(Number.parseInt(limitCategoriesParam, 10) || 10, 1), 50);
  const limitPhotos = Math.min(Math.max(Number.parseInt(limitPhotosParam, 10) || 20, 1), 100);

  if (!q) {
    return NextResponse.json({
      categories: [],
      photos: [],
      meta: { q, categoriesCount: 0, photosCount: 0 },
    });
  }

  const session = await auth();
  const internalVisibilities: CategoryVisibility[] = [CategoryVisibility.internal, CategoryVisibility.public];

  const categoryWhere: Prisma.CategoryWhereInput = !session?.user
    ? { visibility: CategoryVisibility.public }
    : session.user.role === "admin"
      ? {}
      : { visibility: { in: internalVisibilities } };

  const categories = await prisma.category.findMany({
    where: {
      ...categoryWhere,
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
    take: limitCategories,
  });

  const parsedCategoryId = categoryIdParam ? Number.parseInt(categoryIdParam, 10) : undefined;
  const photoWhere: Prisma.PhotoWhereInput = {
    ...(Number.isInteger(parsedCategoryId) ? { categoryId: parsedCategoryId } : {}),
    ...(session?.user
      ? session.user.role === "admin"
        ? {}
        : { category: { visibility: { in: internalVisibilities } } }
      : { category: { visibility: CategoryVisibility.public } }),
    OR: [
      { description: { contains: q } },
      { originalName: { contains: q } },
      { filename: { contains: q } },
    ],
  };

  const photos = await prisma.photo.findMany({
    where: photoWhere,
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { username: true } },
      category: { select: { id: true, name: true } },
    },
    take: limitPhotos,
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      photoCount: c._count.photos,
      createdAt: c.createdAt,
      visibility: c.visibility,
    })),
    photos: photos.map((p) => ({
      id: p.id,
      categoryId: p.category.id,
      categoryName: p.category.name,
      filename: p.filename,
      originalName: p.originalName,
      description: p.description,
      createdAt: p.createdAt,
      uploader: p.uploader.username,
      fileUrl: getPublicObjectUrl(p.filename),
      thumbnailUrl: getPublicThumbnailUrl(p.filename),
    })),
    meta: {
      q,
      categoriesCount: categories.length,
      photosCount: photos.length,
    },
  });
}

