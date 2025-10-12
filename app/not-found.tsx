"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">页面未找到</h2>
          <p className="text-muted-foreground">
            抱歉，您访问的页面不存在或已被移除。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回上一页
          </Button>
        </div>

        <div className="pt-4 text-xs text-muted-foreground">
          如果您认为这是一个错误，请联系管理员。
        </div>
      </div>
    </div>
  );
}
