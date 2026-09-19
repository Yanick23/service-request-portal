import type { ReactNode } from 'react';
import { Alert as UiAlert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<'danger' | 'warning', string> = {
  danger: '',
  warning: 'text-amber-800 [&_[data-slot=alert-description]]:text-amber-800/90 dark:text-amber-300',
};

export function Alert({ variant, children }: { variant: 'danger' | 'warning'; children: ReactNode }) {
  return (
    <UiAlert variant={variant === 'danger' ? 'destructive' : 'default'} className={cn(VARIANT_STYLES[variant])}>
      <AlertDescription>{children}</AlertDescription>
    </UiAlert>
  );
}
