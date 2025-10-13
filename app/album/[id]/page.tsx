import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PhotoGrid } from "@/components/photo-grid";
import { UploadDialog } from "@/components/upload-dialog";
import { getPublicObjectUrl, getPublicThumbnailUrl } from "@/lib/storage";
import { Images, CalendarClock, CalendarDays, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CategoryVisibility } from "@prisma/client";
import { SearchTrigger } from "@/components/search-trigger";
import { SortToggle } from "@/components/sort-toggle";

export default async function AlbumPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { id } = await params;
  const q = (await searchParams) ?? {};
  const sort = (typeof q["sort"] === "string" ? q["sort"] : undefined) === "asc" ? "asc" : "desc";
  const categoryId = Number.parseInt(id, 10);
  if (!Number.isInteger(categoryId)) {
    notFound();
  }

  const session = await auth();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      photos: {
        orderBy: { createdAt: sort },
        include: {
          uploader: { select: { username: true } },
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  const isAdmin = session?.user?.role === "admin";
  const isLoggedIn = Boolean(session?.user);

  if (!isAdmin) {
    if (category.visibility === "private") {
      notFound();
    }
    if (category.visibility === "internal" && !isLoggedIn) {
      redirect(`/login?callbackUrl=/album/${category.id}`);
    }
  }

  const viewerId = (() => {
    if (!session?.user?.id) return null;
    const parsed = Number.parseInt(session.user.id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  })();
  const canManageAll = Boolean(isAdmin);
  const allowOwnActions = viewerId !== null;

  const uploadCategories = session?.user
    ? await prisma.category.findMany({
        where: isAdmin
          ? {}
          : {
              visibility: {
                in: [CategoryVisibility.internal, CategoryVisibility.public],
              },
            },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const photos = category.photos.map((photo) => ({
    id: photo.id,
    filename: photo.filename,
    originalName: photo.originalName,
    description: photo.description,
    createdAt: photo.createdAt.toISOString(),
    uploader: photo.uploader.username,
    thumbnailUrl: getPublicThumbnailUrl(photo.filename),
    fileUrl: getPublicObjectUrl(photo.filename),
    isOwner: viewerId !== null && photo.uploaderId === viewerId,
  }));

  const latestPhotoDate = category.photos[0]?.createdAt ?? category.createdAt;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <Images className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
              <ImageIcon className="h-3 w-3" />
              {photos.length} 张照片
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <CalendarClock className="h-3 w-3" />
              最近更新：{format(latestPhotoDate, "yyyy-MM-dd HH:mm", { locale: zhCN })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <CalendarDays className="h-3 w-3" />
              创建时间：{format(category.createdAt, "yyyy-MM-dd", { locale: zhCN })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SearchTrigger categoryId={category.id} />
          <SortToggle />
        {session?.user ? (
          <UploadDialog
            categories={uploadCategories}
            defaultCategoryId={category.id}
            triggerVariant="outline"
            triggerSize="sm"
            triggerLabel="上传照片"
          />
        ) : null}
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          暂无照片，欢迎上传。
        </div>
      ) : (
        <PhotoGrid
          photos={photos}
          canManageAll={canManageAll}
          allowOwnActions={allowOwnActions}
          downloadStrategy="api"
        />
      )}
    </div>
  );
}

// client-only search trigger moved to components/search-trigger.tsx

// client-only search trigger moved to components/search-trigger.tsx
