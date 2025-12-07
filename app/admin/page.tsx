import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin-dashboard";
import type { CategoryVisibility, FileSetVisibility, UserRole, UserStatus } from "@prisma/client";

type CategoryWithCount = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  visibility: CategoryVisibility;
  _count: { photos: number };
};

type UserWithPhotoCount = {
  id: number;
  username: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  _count: { photos: number };
};

type ShareLinkWithCategory = {
  id: number;
  categoryId: number;
  token: string;
  expiresAt: Date | null;
  createdAt: Date;
  category: { name: string };
};

type FileSetWithCount = {
  id: number;
  name: string;
  description: string | null;
  visibility: FileSetVisibility;
  createdAt: Date;
  _count: { files: number };
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  const [categories, users, shareLinks, fileSets] = await Promise.all<[
    CategoryWithCount[],
    UserWithPhotoCount[],
    ShareLinkWithCategory[],
    FileSetWithCount[],
  ]>([
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true } } },
    }),
    prisma.shareLink.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { name: true },
        },
      },
    }),
    prisma.fileSet.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { files: true } } },
    }),
  ]);

  return (
    <AdminDashboard
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        photoCount: category._count.photos,
        createdAt: category.createdAt.toISOString(),
        visibility: category.visibility,
      }))}
      users={users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        photoCount: user._count.photos,
        createdAt: user.createdAt.toISOString(),
      }))}
      shareLinks={shareLinks.map((link) => ({
        id: link.id,
        token: link.token,
        categoryId: link.categoryId,
        categoryName: link.category.name,
        expiresAt: link.expiresAt?.toISOString() ?? null,
        createdAt: link.createdAt.toISOString(),
      }))}
      fileSets={fileSets.map((fs) => ({
        id: fs.id,
        name: fs.name,
        description: fs.description,
        visibility: fs.visibility,
        fileCount: fs._count.files,
        createdAt: fs.createdAt.toISOString(),
      }))}
    />
  );
}
