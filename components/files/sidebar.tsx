"use client";

import { FileSet } from "./types";

export function FilesSidebar({
  fileSets,
  activeFileSetId,
  onSelect,
}: {
  fileSets: FileSet[];
  activeFileSetId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
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
              onClick={() => onSelect(fs.id)}
            >
              <div className="flex items-center justify之间">
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
  );
}

