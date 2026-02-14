'use client';

import { cn } from '@/lib/utils';
import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <aside className="hidden w-64 shrink-0 space-y-6 md:block">
      <div className="flex items-center gap-2 px-3">
        <BookOpen className="text-primary h-5 w-5" />
        <h2 className="font-semibold">文档导航</h2>
      </div>

      <nav className="space-y-6">
        {sections.map(section => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-muted-foreground px-3 text-sm font-medium">{section.title}</h3>
            <ul className="space-y-1">
              {section.items.map(item => {
                const href = `/help/${item.slug}`;
                const isActive = pathname === href;

                return (
                  <li key={item.slug}>
                    <Link
                      href={href}
                      className={cn(
                        'hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive && 'bg-muted text-primary font-medium'
                      )}
                    >
                      <ChevronRight
                        className={cn('h-4 w-4 transition-transform', isActive && 'text-primary')}
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

      <div className="border-t px-3 pt-4">
        <Link
          href="/help"
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          返回文档首页
        </Link>
      </div>
    </aside>
  );
}
