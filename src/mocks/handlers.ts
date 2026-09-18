import { http, HttpResponse } from 'msw';
import { db, generateId } from './data';
import type {
  ServiceRequest,
  ServiceRequestPage,
  ServiceRequestStatus,
  CreateServiceRequestPayload,
  UpdateServiceRequestStatusPayload,
  ProblemDetails,
} from '../types/serviceRequest';
import { ALLOWED_TRANSITIONS } from '../types/serviceRequest';

const API_BASE = '/api';

function problem(status: number, title: string, detail: string, extra: Record<string, unknown> = {}) {
  const body: ProblemDetails = {
    type: `https://api.example.test/problems/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail,
    ...extra,
  };
  return HttpResponse.json(body, { status, headers: { 'Content-Type': 'application/problem+json' } });
}

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const handlers = [
  http.get(`${API_BASE}/requests`, async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const status = url.searchParams.get('status') as ServiceRequestStatus | null;
    const priority = url.searchParams.get('priority');
    const sort = url.searchParams.get('sort') ?? '-createdAt';
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '10');

    if (pageSize < 1 || pageSize > 100) {
      return problem(400, 'Invalid request', "Query parameter 'pageSize' must be between 1 and 100.");
    }

    let items = [...db];

    if (search) {
      items = items.filter(
        (r) => r.title.toLowerCase().includes(search) || r.requesterName.toLowerCase().includes(search),
      );
    }
    if (status) items = items.filter((r) => r.status === status);
    if (priority) items = items.filter((r) => r.priority === priority);

    const field = sort.replace('-', '') as 'createdAt' | 'updatedAt' | 'priority';
    const desc = sort.startsWith('-');
    const priorityRank = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    items.sort((a, b) => {
      let cmp = 0;
      if (field === 'priority') cmp = priorityRank[a.priority] - priorityRank[b.priority];
      else cmp = new Date(a[field]).getTime() - new Date(b[field]).getTime();
      return desc ? -cmp : cmp;
    });

    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    const result: ServiceRequestPage = { items: pageItems, page, pageSize, total, totalPages };
    return HttpResponse.json(result);
  }),

  http.post(`${API_BASE}/requests`, async ({ request }) => {
    await delay();
    const payload = (await request.json()) as CreateServiceRequestPayload;

    const errors: Record<string, string[]> = {};
    if (!payload.title || payload.title.length < 3) errors.title = ['Title must be at least 3 characters long.'];
    if (!payload.description || payload.description.length < 10)
      errors.description = ['Description must be at least 10 characters long.'];
    if (!payload.requesterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.requesterEmail))
      errors.requesterEmail = ['Enter a valid email address.'];
    if (!payload.category) errors.category = ['Category is required.'];
    if (!payload.requesterName || payload.requesterName.length < 2)
      errors.requesterName = ['Requester name must be at least 2 characters long.'];

    if (Object.keys(errors).length > 0) {
      return problem(422, 'Validation failed', 'The submitted service request contains invalid fields.', {
        errors,
      });
    }

    const now = new Date().toISOString();
    const created: ServiceRequest = {
      id: generateId(),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
      status: 'OPEN',
      requesterName: payload.requesterName,
      requesterEmail: payload.requesterEmail,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    db.unshift(created);

    return HttpResponse.json(created, {
      status: 201,
      headers: { Location: `/api/requests/${created.id}` },
    });
  }),

  http.get(`${API_BASE}/requests/:id`, async ({ params }) => {
    await delay();
    const found = db.find((r) => r.id === params.id);
    if (!found) {
      return problem(404, 'Service request not found', `No service request exists with id ${params.id}.`);
    }
    return HttpResponse.json(found);
  }),

  http.patch(`${API_BASE}/requests/:id/status`, async ({ params, request }) => {
    await delay();
    const found = db.find((r) => r.id === params.id);
    if (!found) {
      return problem(404, 'Service request not found', `No service request exists with id ${params.id}.`);
    }

    const payload = (await request.json()) as UpdateServiceRequestStatusPayload;

    if (payload.version !== found.version) {
      return problem(
        409,
        'Update conflict',
        'The request was updated by someone else. Refresh and try again.',
      );
    }

    const allowed = ALLOWED_TRANSITIONS[found.status];
    if (!allowed.includes(payload.status)) {
      return problem(422, 'Invalid status transition', `A ${found.status} request cannot move to ${payload.status}.`, {
        errors: { status: [`Transition from ${found.status} to ${payload.status} is not allowed.`] },
      });
    }

    found.status = payload.status;
    found.version += 1;
    found.updatedAt = new Date().toISOString();

    return HttpResponse.json(found);
  }),
];