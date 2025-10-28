"use client";

import { useEffect, useState } from "react";
import { FileIcon } from "lucide-react";
import { FilesToolbar } from "@/components/files/toolbar";
import { FilesSidebar } from "@/components/files/sidebar";
import { FilesTable } from "@/components/files/table";
import { FilesPreviewDialog } from "@/components/files/preview-dialog";
import { FilesUploadDialog } from "@/components/files/upload-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FileItem, FileSet } from "@/components/files/types";

export function FileManager() {
  const [fileSets, setFileSets] = useState<FileSet[]>([]);
  const [activeFileSetId, setActiveFileSetId] = useState<number | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Load filesets on mount
  useEffect(() => {
    loadFileSets();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Load files when fileset or query changes
  useEffect(() => {
    if (activeFileSetId) {
      loadFiles();
    }
  }, [activeFileSetId, debouncedQuery]);

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
      if (debouncedQuery) params.set("q", debouncedQuery);

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
          {/* Removed header file count badge per request */}
        </div>
        <FilesToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUploadClick={() => setShowUpload(true)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 md:gap-8">
        <FilesSidebar
          fileSets={fileSets}
          activeFileSetId={activeFileSetId}
          onSelect={setActiveFileSetId}
        />

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

          <FilesTable
            files={files}
            loading={loading}
            error={error}
            onPreview={setPreviewFile}
            onDelete={handleDelete}
          />
        </section>
      </div>

      <FilesUploadDialog open={showUpload} onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      <FilesPreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
