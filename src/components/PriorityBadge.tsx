import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ServiceRequestPriority } from '../types/serviceRequest';

const PRIORITY_STYLES: Record<ServiceRequestPriority, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export function PriorityBadge({ priority }: { priority: ServiceRequestPriority }) {
  return <Badge className={cn(PRIORITY_STYLES[priority])}>{priority}</Badge>;
}
