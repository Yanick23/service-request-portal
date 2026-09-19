import { describe, expect, it } from 'vitest';
import { ApiError, firstFieldErrors } from './client';
import type { ValidationProblemDetails } from '../types/serviceRequest';

describe('firstFieldErrors', () => {
  it('picks the first message for each field', () => {
    const problem: ValidationProblemDetails = {
      type: 'https://api.example.test/problems/validation-failed',
      title: 'Validation failed',
      status: 422,
      errors: {
        title: ['Title must be at least 3 characters long.', 'Title is required.'],
        requesterEmail: ['Enter a valid email address.'],
      },
    };

    expect(firstFieldErrors(problem)).toEqual({
      title: 'Title must be at least 3 characters long.',
      requesterEmail: 'Enter a valid email address.',
    });
  });
});

describe('ApiError', () => {
  it('flags conflicts, validation errors and unauthenticated responses by status', () => {
    expect(new ApiError({ title: 'Conflict', status: 409 }).isConflict).toBe(true);
    expect(new ApiError({ title: 'Not found', status: 404 }).isConflict).toBe(false);

    expect(new ApiError({ title: 'Bad request', status: 400 }).isValidation()).toBe(false);
    expect(
      new ApiError({ title: 'Unprocessable', status: 422, errors: {} } as ValidationProblemDetails).isValidation(),
    ).toBe(true);
    expect(
      new ApiError({ title: 'Bad request', status: 400, errors: {} } as ValidationProblemDetails).isValidation(),
    ).toBe(true);
    expect(new ApiError({ title: 'Not found', status: 404 }).isValidation()).toBe(false);

    expect(new ApiError({ title: 'Unauthorized', status: 401 }).isUnauthenticated).toBe(true);
    expect(new ApiError({ title: 'Forbidden', status: 403 }).isUnauthenticated).toBe(false);
  });
});
