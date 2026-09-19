import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ServiceRequestStatus } from '../types/serviceRequest';

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  CLOSED: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return <Badge className={cn(STATUS_STYLES[status])}>{status}</Badge>;
}
