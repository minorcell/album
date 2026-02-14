'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UploadForm } from '@/components/upload-form';
import { useState } from 'react';

interface UploadDialogProps {
  categories: Array<{ id: number; name: string }>;
  defaultCategoryId?: number;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
}

export function UploadDialog({
  categories,
  defaultCategoryId,
  triggerLabel = '上传',
  triggerVariant = 'default',
  triggerSize = 'default',
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
      <DialogContent className="max-w-2xl" onOpenAutoFocus={event => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>上传媒体</DialogTitle>
          <DialogDescription>
            支持批量上传 JPG / PNG / GIF / WebP 图片（10MB 内）以及 MP4 / WebM / MOV 视频（512MB
            内）。
          </DialogDescription>
        </DialogHeader>
        <UploadForm
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
