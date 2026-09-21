import { describe, expect, it } from 'vitest';
import { validateServiceRequestFields, type ServiceRequestFieldInput } from '../../../lib/serviceRequestValidation';

const validInput: ServiceRequestFieldInput = {
  title: 'Printer is not responding',
  description: 'The printer on the 3rd floor stopped responding today.',
  category: 'Hardware',
  requesterName: 'Maria Silva',
  requesterEmail: 'maria.silva@example.com',
};

describe('validateServiceRequestFields', () => {
  it('returns no errors for valid input', () => {
    expect(validateServiceRequestFields(validInput)).toEqual({});
  });

  it('rejects a title that is too short', () => {
    const errors = validateServiceRequestFields({ ...validInput, title: 'ab' });
    expect(errors.title).toEqual(['Title must be at least 3 characters long.']);
  });

  it('accepts a title at the minimum length', () => {
    const errors = validateServiceRequestFields({ ...validInput, title: 'abc' });
    expect(errors.title).toBeUndefined();
  });

  it('rejects a title over 120 characters', () => {
    const errors = validateServiceRequestFields({ ...validInput, title: 'a'.repeat(121) });
    expect(errors.title).toEqual(['Title must not exceed 120 characters.']);
  });

  it('accepts a title at the maximum length', () => {
    const errors = validateServiceRequestFields({ ...validInput, title: 'a'.repeat(120) });
    expect(errors.title).toBeUndefined();
  });

  it('trims whitespace before checking the title length', () => {
    const errors = validateServiceRequestFields({ ...validInput, title: '  ab  ' });
    expect(errors.title).toEqual(['Title must be at least 3 characters long.']);
  });

  it('rejects a description that is too short', () => {
    const errors = validateServiceRequestFields({ ...validInput, description: 'too short' });
    expect(errors.description).toEqual(['Description must be at least 10 characters long.']);
  });

  it('rejects a category that is too short', () => {
    const errors = validateServiceRequestFields({ ...validInput, category: 'a' });
    expect(errors.category).toEqual(['Category must be at least 2 characters long.']);
  });

  it('rejects a requester name that is too short', () => {
    const errors = validateServiceRequestFields({ ...validInput, requesterName: 'a' });
    expect(errors.requesterName).toEqual(['Requester name must be at least 2 characters long.']);
  });

  it.each(['not-an-email', 'missing-domain@', '@missing-local.com', 'no-at-sign.com', ''])(
    'rejects an invalid email: %s',
    (requesterEmail) => {
      const errors = validateServiceRequestFields({ ...validInput, requesterEmail });
      expect(errors.requesterEmail).toEqual(['Enter a valid email address.']);
    },
  );

  it('reports errors for every invalid field at once', () => {
    const errors = validateServiceRequestFields({
      title: '',
      description: '',
      category: '',
      requesterName: '',
      requesterEmail: '',
    });

    expect(Object.keys(errors).sort()).toEqual([
      'category',
      'description',
      'requesterEmail',
      'requesterName',
      'title',
    ]);
  });
});
