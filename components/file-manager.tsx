"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Search, Trash2, FileIcon, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FileSet = {
  id: number;
  name: string;
  description: string | null;
  visibility: string;
  fileCount: number;
};

type FileItem = {
  id: number;
  filename: string;
  originalName: string;
  description: string | null;
  mimeType: string;
  size: number;
  url: string;
  uploaderId: number;
  createdAt: string;
};

export function FileManager() {
  const [fileSets, setFileSets] = useState<FileSet[]>([]);
  const [activeFileSetId, setActiveFileSetId] = useState<number | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Load filesets on mount
  useEffect(() => {
    loadFileSets();
  }, []);

  // Load files when fileset changes
  useEffect(() => {
    if (activeFileSetId) {
      loadFiles();
    }
  }, [activeFileSetId, searchQuery]);

  async function loadFileSets() {
    try {
      setLoading(true);
      const res = await fetch("/api/filesets");
      const json = await res.json();
      setFileSets(json.items ?? []);
      if (json.items?.length && !activeFileSetId) {
        setActiveFileSetId(json.items[0].id);
      }
    } catch (e) {
      setError("加载文件分类失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles() {
    if (!activeFileSetId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        filesetId: String(activeFileSetId),
      });
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/files?${params.toString()}`);
      const json = await res.json();
      setFiles(json.items ?? []);
      setError(null);
    } catch (e) {
      setError("加载文件列表失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    if (!activeFileSetId) {
      setError("请先选择文件分类");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filesetId", String(activeFileSetId));

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "上传失败");
      }

      await loadFiles();
      setShowUpload(false);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "上传失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(fileId: number) {
    if (!confirm("确定要删除此文件吗？")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "删除失败");
      }

      await loadFiles();
      setError(null);
    } catch (e: any) {
      setError(e?.message || "删除失败");
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  const activeFileSet = fileSets.find((fs) => fs.id === activeFileSetId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <FileIcon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">文件管理</h1>
          </div>
          {activeFileSet && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                文件数 {activeFileSet.fileCount}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Button onClick={() => setShowUpload(true)} disabled={!activeFileSetId} variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            上传文件
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 md:gap-8">
        {/* Fileset selector sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="rounded-md border p-3">
            <div className="mb-3 text-sm font-medium">文件分类</div>
            <div className="space-y-1">
              {fileSets.map((fs) => (
                <button
                  key={fs.id}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                    activeFileSetId === fs.id ? "bg-muted font-medium" : ""
                  }`}
                  onClick={() => setActiveFileSetId(fs.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{fs.name}</span>
                    <span className="text-xs text-muted-foreground">{fs.fileCount}</span>
                  </div>
                  {fs.description && (
                    <div className="mt-1 truncate text-xs text-muted-foreground">{fs.description}</div>
                  )}
                </button>
              ))}
              {fileSets.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  暂无文件分类
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* File list */}
        <section className="flex-1 min-w-0">
          {activeFileSet && (
            <div className="mb-3">
              <h2 className="text-lg font-medium">{activeFileSet.name}</h2>
              {activeFileSet.description && (
                <p className="text-sm text-muted-foreground">{activeFileSet.description}</p>
              )}
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">文件名</TableHead>
                  <TableHead className="w-28">类型</TableHead>
                  <TableHead className="w-24">大小</TableHead>
                  <TableHead className="w-32">上传时间</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {loading ? "加载中..." : "暂无文件"}
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate max-w-[40ch]" title={file.originalName}>
                              {file.originalName}
                            </span>
                            {file.description && (
                              <span className="text-xs text-muted-foreground">{file.description}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-block truncate max-w-[10ch]" title={file.mimeType}>
                          {file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{formatFileSize(file.size)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

function UploadDialog({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上传文件</DialogTitle>
          <DialogDescription>选择要上传的文件（最大 100MB）</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>选择文件</Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "上传中..." : "上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
