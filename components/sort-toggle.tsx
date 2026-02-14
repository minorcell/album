'use client';

import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function SortToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';

  const toggleSort = () => {
    const next = current === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8"
      onClick={toggleSort}
      aria-label={current === 'asc' ? '切换为倒序' : '切换为正序'}
      aria-pressed={current === 'asc'}
    >
      {current === 'asc' ? (
        <>
          <ArrowUp className="mr-1 h-4 w-4" /> 正序
        </>
      ) : (
        <>
          <ArrowDown className="mr-1 h-4 w-4" /> 倒序
        </>
      )}
    </Button>
  );
}
