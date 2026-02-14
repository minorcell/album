'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Upload } from 'lucide-react';

export function FilesToolbar({
  searchQuery,
  onSearchChange,
  onUploadClick,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onUploadClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          placeholder="搜索文件..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-64 pl-8"
        />
      </div>
      <Button onClick={onUploadClick} variant="outline" size="sm">
        <Upload className="mr-2 h-4 w-4" />
        上传文件
      </Button>
    </div>
  );
}
