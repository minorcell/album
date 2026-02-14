'use client';

import { Button } from '@/components/ui/button';
import * as React from 'react';

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: React.ReactNode;
};

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading = false, loadingText = '处理中...', disabled, ...props }, ref) => (
    <Button ref={ref} disabled={loading || disabled} {...props}>
      {loading ? loadingText : children}
    </Button>
  )
);

LoadingButton.displayName = 'LoadingButton';
