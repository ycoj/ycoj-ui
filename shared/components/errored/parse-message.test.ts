import parseErrorMessage from './parse-message';
import type { HydroError } from '@/shared/types/error';
import { describe, expect, it } from 'vitest';

describe('parseErrorMessage', () => {
  it('returns plain strings unchanged', () => {
    expect(parseErrorMessage('Something went wrong')).toBe(
      'Something went wrong'
    );
  });

  it('substitutes params into message placeholders', () => {
    const err: HydroError = {
      name: 'ValidationError',
      message: 'Field {0} must be {1}',
      params: ['email', 'unique'],
    };
    expect(parseErrorMessage(err)).toBe('Field email must be unique');
  });

  it('returns raw message when params are missing', () => {
    const err: HydroError = {
      name: 'Error',
      message: 'No params {0}',
    };
    expect(parseErrorMessage(err)).toBe('No params {0}');
  });
});
