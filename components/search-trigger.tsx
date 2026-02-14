'use client';

import { SearchDialog } from '@/components/search-dialog';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function SearchTrigger({ categoryId }: { categoryId?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Search className="mr-2 h-4 w-4" /> 搜索
      </Button>
      <SearchDialog open={open} onOpenChange={setOpen} categoryId={categoryId} />
    </>
  );
}
