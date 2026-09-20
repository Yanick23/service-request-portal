export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ServiceRequestFieldInput {
  title: string;
  description: string;
  category: string;
  requesterName: string;
  requesterEmail: string;
}


export function validateServiceRequestFields(input: ServiceRequestFieldInput): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  const title = (input.title ?? '').trim();
  if (title.length < 3) errors.title = ['Title must be at least 3 characters long.'];
  else if (title.length > 120) errors.title = ['Title must not exceed 120 characters.'];

  const description = (input.description ?? '').trim();
  if (description.length < 10) errors.description = ['Description must be at least 10 characters long.'];

  const category = (input.category ?? '').trim();
  if (category.length < 2) errors.category = ['Category must be at least 2 characters long.'];

  const requesterName = (input.requesterName ?? '').trim();
  if (requesterName.length < 2) errors.requesterName = ['Requester name must be at least 2 characters long.'];

  if (!EMAIL_PATTERN.test(input.requesterEmail ?? '')) errors.requesterEmail = ['Enter a valid email address.'];

  return errors;
}
