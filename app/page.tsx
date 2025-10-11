import Link from "next/link"
import Image from "next/image"

import { Prisma, CategoryVisibility } from "@prisma/client"
import { prisma } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { UploadDialog } from "@/components/upload-dialog"
import { Images } from "lucide-react"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth()
  const internalVisibilities: CategoryVisibility[] = ["internal", "public"]
  const where: Prisma.CategoryWhereInput = !session?.user
    ? { visibility: "public" }
    : session.user.role === "admin"
      ? {}
      : { visibility: { in: internalVisibilities } }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      photos: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          filename: true,
          createdAt: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <Images className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">相册</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            浏览工作室成员上传的活动照片与证书。
          </p>
        </div>
        {session?.user && categories.length > 0 && (
          <div className="flex items-center gap-2">
            <UploadDialog
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
              triggerVariant="outline"
              triggerSize="sm"
              triggerLabel="快速上传"
            />
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/album/${category.id}`}>
              <Card className="group relative h-64 overflow-hidden border transition hover:shadow-xl">
                {category.photos[0] ? (
                  <ImageFill filename={category.photos[0].filename} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                    <span className="text-sm text-muted-foreground">
                      暂无照片
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 text-white">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{category.name}</span>
                    <span className="text-xs text-white/80">
                      {category._count.photos} 张
                    </span>
                  </div>
                  {category.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-white/80">
                      {category.description}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ImageFill({ filename }: { filename: string }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={`/uploads/thumbnails/thumb-${filename}`}
        alt="分类封面"
        fill
        priority={false}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-muted-foreground">
      <Images className="h-10 w-10 text-primary" />
      <p>暂无相册，请先在控制台中创建分类。</p>
    </div>
  )
}
