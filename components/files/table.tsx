"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileIcon, Download, Trash2, Eye, Image as ImageIcon, Video, Music, FileText, Archive, Code } from "lucide-react";
import { FileItem, formatFileSize } from "./types";

export function FilesTable({
  files,
  loading,
  error,
  onPreview,
  onDelete,
}: {
  files: FileItem[];
  loading: boolean;
  error: string | null;
  onPreview: (file: FileItem) => void;
  onDelete: (id: number) => void;
}) {
  function renderTypeIcon(mime: string) {
    const cls = "h-4 w-4 text-muted-foreground";
    if (mime.startsWith("image/")) return <ImageIcon className={cls} />;
    if (mime.startsWith("video/")) return <Video className={cls} />;
    if (mime.startsWith("audio/")) return <Music className={cls} />;
    if (mime === "application/pdf") return <FileText className={cls} />;
    if (/zip|tar|rar/.test(mime)) return <Archive className={cls} />;
    if (mime.startsWith("text/") || /json|xml|yaml|javascript/.test(mime)) return <Code className={cls} />;
    return <FileIcon className={cls} />;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">文件名</TableHead>
            <TableHead className="w-28">类型</TableHead>
            <TableHead className="w-24">大小</TableHead>
            <TableHead className="w-32">上传时间</TableHead>
            <TableHead className="w-32">操作</TableHead>
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
                    {renderTypeIcon(file.mimeType)}
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
                    <Button variant="ghost" size="sm" title="预览" onClick={() => onPreview(file)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="下载/打开"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, "_blank");
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="删除" onClick={() => onDelete(file.id)}>
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
  );
}
