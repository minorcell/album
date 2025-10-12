"use client";

import { useEffect, useState, FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PhotoGrid } from "@/components/photo-grid";

interface ShareViewerProps {
  token: string;
}

interface ShareResponse {
  token: string;
  expiresAt: string | null;
  category: {
    id: number;
    name: string;
    description: string | null;
    photos: Array<{
      id: number;
      filename: string;
      originalName: string | null;
      description: string | null;
      createdAt: string;
      uploader: string;
      thumbnailUrl: string;
      fileUrl: string;
    }>;
  };
}

export function ShareViewer({ token }: ShareViewerProps) {
  const [data, setData] = useState<ShareResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "password" | "error" | "success">("loading");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);

  const requestShare = async (options?: { password?: string }) => {
    setError(null);
    setStatus("loading");
    const params = new URLSearchParams({ token });
    if (options?.password) {
      params.set("password", options.password);
    }
    const response = await fetch(`/api/share?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        setStatus("password");
        setError(payload.error ?? "需要密码");
        return;
      }
      setStatus("error");
      setError(payload.error ?? "无法加载分享内容");
      return;
    }

    setData(payload as ShareResponse);
    setStatus("success");
  };

  useEffect(() => {
    void requestShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempts((prev) => prev + 1);
    await requestShare({ password });
  };

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">正在加载分享内容...</p>;
  }

  if (status === "password") {
    return (
      <div className="mx-auto max-w-sm space-y-4">
        <Alert>
          <AlertTitle>访问受限</AlertTitle>
          <AlertDescription>{error ?? "请输入访问密码"}</AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-password">访问密码</Label>
            <Input
              id="share-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入分享密码"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            提交
          </Button>
          {attempts > 0 && error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </form>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>分享不可用</AlertTitle>
        <AlertDescription>{error ?? "无法访问该分享链接"}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const mappedPhotos = data.category.photos.map((photo) => ({
    id: photo.id,
    filename: photo.filename,
    originalName: photo.originalName,
    description: photo.description,
    createdAt: photo.createdAt,
    uploader: photo.uploader,
    thumbnailUrl: photo.thumbnailUrl,
    fileUrl: photo.fileUrl,
    isOwner: false,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{data.category.name}</h1>
        {data.category.description && (
          <p className="text-sm text-muted-foreground">{data.category.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {data.category.photos.length} 张图片
          {data.expiresAt && ` · 链接将在 ${new Date(data.expiresAt).toLocaleString()} 过期`}
        </p>
      </div>
      {data.category.photos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">暂未添加任何图片。</p>
      ) : (
        <PhotoGrid
          photos={mappedPhotos}
          canManageAll={false}
          allowOwnActions={false}
          downloadStrategy="public"
        />
      )}
    </div>
  );
}
