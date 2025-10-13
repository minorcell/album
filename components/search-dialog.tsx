"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: number;
}

export function SearchDialog({ open, onOpenChange, categoryId }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    categories: Array<{ id: number; name: string; description: string | null; photoCount: number }>;
    photos: Array<{
      id: number;
      categoryId: number;
      categoryName: string;
      filename: string;
      originalName: string | null;
      description: string | null;
      thumbnailUrl: string;
    }>;
  }>({ categories: [], photos: [] });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setResults({ categories: [], photos: [] });
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ q: debounced });
    if (categoryId) params.set("categoryId", String(categoryId));
    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "搜索失败");
        }
        return res.json();
      })
      .then((data) => {
        setResults({
          categories: data.categories.map((c: any) => ({ id: c.id, name: c.name, description: c.description, photoCount: c.photoCount })),
          photos: data.photos.map((p: any) => ({
            id: p.id,
            categoryId: p.categoryId,
            categoryName: p.categoryName,
            filename: p.filename,
            originalName: p.originalName,
            description: p.description,
            thumbnailUrl: p.thumbnailUrl,
          })),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "搜索失败"))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debounced, open, categoryId]);

  const hasResults = useMemo(() => results.categories.length > 0 || results.photos.length > 0, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-2xl p-0 overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card p-3 sm:p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="搜索相册名称、描述，或图片文件名/描述"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">Esc 关闭</span>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4 space-y-6">
          {loading && <p className="text-sm text-muted-foreground">搜索中...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && !hasResults && debounced && (
            <p className="text-sm text-muted-foreground">没有匹配结果</p>
          )}

          {results.categories.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">匹配的相册</h3>
                <Badge variant="outline">{results.categories.length}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.categories.map((c) => (
                  <Link key={c.id} href={`/album/${c.id}`} className="rounded-lg border p-3 hover:bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="outline">{c.photoCount} 张</Badge>
                    </div>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.photos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase text-muted-foreground">匹配的图片</h3>
                <Badge variant="outline">{results.photos.length}</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>预览</TableHead>
                    <TableHead>描述 / 文件名</TableHead>
                    <TableHead>所属相册</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.photos.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" asChild>
                      <Link href={`/album/${p.categoryId}`}>
                        <TableCell>
                          <div className="relative h-16 w-24 overflow-hidden rounded">
                            <Image src={p.thumbnailUrl} alt={p.description ?? p.filename} fill sizes="96px" className="object-cover" unoptimized />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-lg">
                            <p className="font-medium">{p.description || p.originalName || p.filename}</p>
                            <p className="text-xs text-muted-foreground">文件：{p.originalName ?? p.filename}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.categoryName}</TableCell>
                      </Link>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
