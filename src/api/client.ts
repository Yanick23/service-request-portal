import type {
    CreateServiceRequestPayload,
    ListRequestsParams,
    ServiceRequest,
    ServiceRequestPage,
    UpdateServiceRequestStatusPayload,
    ProblemDetails,
    ValidationProblemDetails,
  } from '../types/serviceRequest';
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
  
  export class ApiError extends Error {
    readonly status: number;
    readonly problem: ProblemDetails | ValidationProblemDetails;
  
    constructor(problem: ProblemDetails | ValidationProblemDetails) {
      super(problem.detail ?? problem.title);
      this.name = 'ApiError';
      this.status = problem.status;
      this.problem = problem;
    }
  
    get isConflict() {
      return this.status === 409;
    }
  
    isValidation(): this is { problem: ValidationProblemDetails } {
      return this.status === 422 || this.status === 400;
    }
  }
  
  let getAccessToken: () => string | undefined = () => undefined;
  export function setAccessTokenGetter(fn: () => string | undefined) {
    getAccessToken = fn;
  }
  
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getAccessToken();
  
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init?.headers,
        },
      });
    } catch {
      throw new ApiError({
        title: 'Falha de ligação',
        status: 0,
        detail: 'Não foi possível contactar o servidor. Verifica a tua ligação e tenta novamente.',
      });
    }
  
    if (response.status === 204) {
      return undefined as T;
    }
  
    const body = await response.json().catch(() => null);
  
    if (!response.ok) {
      const problem: ProblemDetails = body ?? {
        title: 'Erro inesperado',
        status: response.status,
      };
      throw new ApiError(problem);
    }
  
    return body as T;
  }
  
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
      return request<ServiceRequestPage>(`/requests${buildQuery(params)}`);
    },
  
    getById(id: string): Promise<ServiceRequest> {
      return request<ServiceRequest>(`/requests/${id}`);
    },
  
    create(payload: CreateServiceRequestPayload): Promise<ServiceRequest> {
      return request<ServiceRequest>('/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  
    updateStatus(id: string, payload: UpdateServiceRequestStatusPayload): Promise<ServiceRequest> {
      return request<ServiceRequest>(`/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  };