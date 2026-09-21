import type { components } from './api.generated';

export type ServiceRequest = components['schemas']['ServiceRequest'];
export type ServiceRequestPage = components['schemas']['ServiceRequestPage'];
export type CreateServiceRequestPayload = components['schemas']['CreateServiceRequest'];
export type UpdateServiceRequestStatusPayload = components['schemas']['UpdateServiceRequestStatus'];
export type ServiceRequestStatus = components['schemas']['ServiceRequestStatus'];
export type ServiceRequestPriority = components['schemas']['ServiceRequestPriority'];
export type ProblemDetails = components['schemas']['ProblemDetails'];
export type ValidationProblemDetails = components['schemas']['ValidationProblemDetails'];

export const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

export const STATUS_VALUES: ServiceRequestStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const PRIORITY_VALUES: ServiceRequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export interface ListRequestsParams {
  search?: string;
  status?: ServiceRequestStatus;
  priority?: ServiceRequestPriority;
  sort?: 'createdAt' | '-createdAt' | 'updatedAt' | '-updatedAt' | 'priority' | '-priority';
  page?: number;
  pageSize?: number;
}