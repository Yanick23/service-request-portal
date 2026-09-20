import { httpClient } from './httpClient';
import type {
  CreateServiceRequestPayload,
  ListRequestsParams,
  ServiceRequest,
  ServiceRequestPage,
  UpdateServiceRequestStatusPayload,
} from '../types/serviceRequest';

export { ApiError, firstFieldErrors, setAccessTokenGetter, setUnauthorizedHandler } from './httpClient';

function buildQuery(params: ListRequestsParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const serviceRequestApi = {
  list(params: ListRequestsParams): Promise<ServiceRequestPage> {
    return httpClient.get<ServiceRequestPage>(`/requests${buildQuery(params)}`);
  },

  getById(id: string): Promise<ServiceRequest> {
    return httpClient.get<ServiceRequest>(`/requests/${id}`);
  },

  create(payload: CreateServiceRequestPayload): Promise<ServiceRequest> {
    return httpClient.post<ServiceRequest>('/requests', payload);
  },

  updateStatus(id: string, payload: UpdateServiceRequestStatusPayload): Promise<ServiceRequest> {
    return httpClient.patch<ServiceRequest>(`/requests/${id}/status`, payload);
  },
};
