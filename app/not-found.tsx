'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-6">
            <AlertCircle className="text-destructive h-16 w-16" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-foreground text-6xl font-bold tracking-tight">404</h1>
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">页面未找到</h2>
          <p className="text-muted-foreground">抱歉，您访问的页面不存在或已被移除。</p>
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

        <div className="text-muted-foreground pt-4 text-xs">
          如果您认为这是一个错误，请联系管理员。
        </div>
      </div>
    </div>
  );
}
