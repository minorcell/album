"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadForm } from "@/components/upload-form";

interface UploadDialogProps {
  categories: Array<{ id: number; name: string }>;
  defaultCategoryId?: number;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  triggerSize?: "default" | "sm" | "lg" | "icon";
}

export function UploadDialog({
  categories,
  defaultCategoryId,
  triggerLabel = "上传",
  triggerVariant = "default",
  triggerSize = "default",
}: UploadDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} disabled={categories.length === 0}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>上传图片</DialogTitle>
          <DialogDescription>支持批量上传 JPG / PNG 图片，单个文件不超过 10MB。</DialogDescription>
        </DialogHeader>
        <UploadForm categories={categories} defaultCategoryId={defaultCategoryId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
