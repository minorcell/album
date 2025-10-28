"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileItem, formatFileSize } from "./types"
import { OfficeViewer } from "@/components/files/viewers/office-viewer"
import { PdfViewer } from "@/components/files/viewers/pdf-viewer"
import { MarkdownViewer } from "@/components/files/viewers/markdown-viewer"
import { useEffect, useState } from "react"

export function FilesPreviewDialog({
  file,
  onClose,
}: {
  file: FileItem | null
  onClose: () => void
}) {
  const open = Boolean(file)
  const isImage = file ? file.mimeType.startsWith("image/") : false
  const isPdf = file ? file.mimeType === "application/pdf" : false
  const isText = file ? file.mimeType.startsWith("text/") : false
  const isMarkdown = file
    ? file.mimeType === "text/markdown" || /\.md$/i.test(file.originalName)
    : false
  const isOffice = file
    ? [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(file.mimeType)
    : false
  const isVideo = file ? file.mimeType.startsWith("video/") : false

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none sm:max-w-none w-[90vw] h-[90vh] md:w-screen md:h-screen md:max-w-none md:rounded-none p-0">
        <div className="flex h-full w-full flex-col">
          <div className="border-b px-4 py-3">
            <DialogHeader>
              <DialogTitle>预览：{file?.originalName ?? "文件"}</DialogTitle>
              <DialogDescription>
                类型：{file?.mimeType ?? "未知"} · 大小：
                {file ? formatFileSize(file.size) : "—"}
              </DialogDescription>
            </DialogHeader>
          </div>
          {!file ? null : (
            <div className="flex-1 overflow-auto">
              {isImage ? (
                <div className="flex h-full w-full items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : isPdf ? (
                <div className="flex h-full w-full items-center justify-center p-6">
                  <div className="space-y-3 text-center text-sm text-muted-foreground">
                    <p>此 PDF 预览将以新窗口打开，或使用下方按钮下载查看。</p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        在新窗口打开
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        下载/查看
                      </Button>
                    </div>
                  </div>
                </div>
              ) : isOffice ? (
                <OfficeViewer src={file.url} />
              ) : isMarkdown ? (
                <MarkdownContent url={file.url} />
              ) : isText ? (
                <iframe
                  src={file.url}
                  className="h-full w-full bg-background"
                />
              ) : isVideo ? (
                <video controls src={file.url} className="h-full w-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6">
                  <div className="space-y-3 text-center text-sm text-muted-foreground">
                    <p>此文件类型暂不支持内联预览。</p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        新窗口打开
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        下载/查看
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MarkdownContent({ url }: { url: string }) {
  const [source, setSource] = useState<string>("")
  useEffect(() => {
    let mounted = true
    fetch(url)
      .then((r) => r.text())
      .then((txt) => {
        if (mounted) setSource(txt)
      })
      .catch(() => setSource("无法加载 Markdown 内容"))
    return () => {
      mounted = false
    }
  }, [url])
  return (
    <div className="h-full w-full overflow-auto p-6">
      <MarkdownViewer source={source} />
    </div>
  )
}
