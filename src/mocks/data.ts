import type { ServiceRequest } from '../types/serviceRequest';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const db: Mutable<ServiceRequest>[] = [
  {
    id: 'REQ-1001',
    title: 'Unable to access customer portal',
    description: 'The customer receives "Account locked" after signing in with valid credentials.',
    category: 'Access',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Example Customer',
    requesterEmail: 'customer@example.com',
    createdAt: '2026-02-10T08:15:00Z',
    updatedAt: '2026-02-10T08:15:00Z',
    version: 1,
  },
  {
    id: 'REQ-1002',
    title: 'Duplicate invoice on February statement',
    description: 'Invoice INV-88213 appears twice on the February billing statement.',
    category: 'Billing',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    requesterName: 'Second Customer',
    requesterEmail: 'second.customer@example.com',
    createdAt: '2026-02-09T13:42:11Z',
    updatedAt: '2026-02-11T09:05:30Z',
    version: 4,
  },
  {
    id: 'REQ-1003',
    title: 'Self-service app is down for all users',
    description: 'Every sign-in attempt returns HTTP 503 since 06:00 UTC across web and mobile.',
    category: 'Outage',
    priority: 'CRITICAL',
    status: 'OPEN',
    requesterName: 'Operations Desk',
    requesterEmail: 'ops.desk@example.com',
    createdAt: '2026-02-12T06:05:00Z',
    updatedAt: '2026-02-12T06:05:00Z',
    version: 1,
  },
  {
    id: 'REQ-1004',
    title: 'Cannot download monthly report as PDF',
    description: 'The export button spins indefinitely and no file is produced.',
    category: 'Reporting',
    priority: 'LOW',
    status: 'RESOLVED',
    requesterName: 'Ana Fernandes',
    requesterEmail: 'ana.fernandes@example.com',
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-02-03T15:30:00Z',
    version: 3,
  },
  {
    id: 'REQ-1005',
    title: 'Request to update billing address',
    description: 'Customer moved offices and needs the billing address updated for future invoices.',
    category: 'Billing',
    priority: 'LOW',
    status: 'CLOSED',
    requesterName: 'Carlos Mate',
    requesterEmail: 'carlos.mate@example.com',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z',
    version: 2,
  },
];

let nextId = 1006;
export function generateId(): string {
  return `REQ-${nextId++}`;
}
