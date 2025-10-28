"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  title: string;
  items: Array<{
    title: string;
    slug: string;
  }>;
}

interface DocSidebarProps {
  sections: DocSection[];
}

export function DocSidebar({ sections }: DocSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 space-y-6 hidden md:block">
      <div className="flex items-center gap-2 px-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">文档导航</h2>
      </div>

      <nav className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-sm font-medium text-muted-foreground">{section.title}</h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const href = `/help/${item.slug}`;
                const isActive = pathname === href;

                return (
                  <li key={item.slug}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                        isActive && "bg-muted font-medium text-primary"
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isActive && "text-primary"
                        )}
                      />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t pt-4 px-3">
        <Link
          href="/help"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <BookOpen className="h-4 w-4" />
          返回文档首页
        </Link>
      </div>
    </aside>
  );
}
