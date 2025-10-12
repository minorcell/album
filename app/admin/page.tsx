import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  const [categories, users, shareLinks] = await Promise.all([
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
    />
  );
}
