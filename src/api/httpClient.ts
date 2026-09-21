import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type { ProblemDetails, ValidationProblemDetails } from '../types/serviceRequest';

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

  get isUnauthenticated() {
    return this.status === 401;
  }

  isValidation(): this is { problem: ValidationProblemDetails } {
    return (this.status === 422 || this.status === 400) && 'errors' in this.problem;
  }
}

export function firstFieldErrors(problem: ValidationProblemDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(problem.errors)) {
    errors[field] = messages[0];
  }
  return errors;
}

let getAccessToken: () => string | undefined = () => undefined;
export function setAccessTokenGetter(fn: () => string | undefined) {
  getAccessToken = fn;
}

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}


export interface HttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

class AxiosHttpClient implements HttpClient {
  private readonly instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({ baseURL });

    this.instance.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ProblemDetails>) => {
        if (!error.response) {
          throw new ApiError({
            title: 'Falha de ligação',
            status: 0,
            detail: 'Não foi possível contactar o servidor. Verifica a tua ligação e tenta novamente.',
          });
        }

        const { status, data } = error.response;
        const problem: ProblemDetails = data ?? { title: 'Erro inesperado', status };

        if (status === 401) {
          onUnauthorized();
        }

        throw new ApiError(problem);
      },
    );
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.instance.get<T>(path);
    return response.status === 204 ? (undefined as T) : response.data;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.instance.post<T>(path, body);
    return response.status === 204 ? (undefined as T) : response.data;
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await this.instance.patch<T>(path, body);
    return response.status === 204 ? (undefined as T) : response.data;
  }
}

// Falls back to a path under BASE_URL (not a bare '/api') so the mocked requests
// stay inside the service worker's registration scope on GitHub Pages — see main.tsx.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${import.meta.env.BASE_URL}api`;

export const httpClient: HttpClient = new AxiosHttpClient(API_BASE_URL);
