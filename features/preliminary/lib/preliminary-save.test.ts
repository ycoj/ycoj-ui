import {
  PreliminaryRequestError,
  savePreliminaryValues,
} from './preliminary-request';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Preliminary: {
      savePreliminary: (
        definition: unknown,
        published: boolean,
        paperId?: string
      ) => ({
        send: () => mocks.save(definition, published, paperId),
      }),
    },
  },
}));

function values(): PreliminaryFormValues {
  return {
    title: '  CSP-J  ',
    content: '',
    sections: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('savePreliminaryValues', () => {
  it('returns the detail path with the normalized payload', async () => {
    mocks.save.mockResolvedValue({
      paperId: 'abc123',
      url: '/preliminary/abc123',
    });
    await expect(savePreliminaryValues(values(), true)).resolves.toBe(
      '/preliminary/abc123'
    );
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'CSP-J' }),
      true,
      undefined
    );
  });

  it('passes the paper id through for edits', async () => {
    mocks.save.mockResolvedValue({
      paperId: 'abc123',
      url: '/preliminary/abc123',
    });
    await expect(
      savePreliminaryValues(values(), false, 'abc123')
    ).resolves.toBe('/preliminary/abc123');
    expect(mocks.save).toHaveBeenCalledWith(expect.anything(), false, 'abc123');
  });

  it('prefers the backend url over the synthesized path', async () => {
    mocks.save.mockResolvedValue({
      paperId: 'abc123',
      url: '/preliminary/abc123?from=save',
    });
    await expect(savePreliminaryValues(values(), true)).resolves.toBe(
      '/preliminary/abc123?from=save'
    );
  });

  it('falls back to the synthesized path when the backend url is missing', async () => {
    mocks.save.mockResolvedValue({ paperId: 'abc123' });
    await expect(savePreliminaryValues(values(), true)).resolves.toBe(
      '/preliminary/abc123'
    );
  });

  it('strips the domain prefix from the backend url, preserving the query', async () => {
    mocks.save.mockResolvedValue({
      paperId: 'abc123',
      url: '/d/system/preliminary/abc123?from=save',
    });
    await expect(savePreliminaryValues(values(), true)).resolves.toBe(
      '/preliminary/abc123?from=save'
    );
  });

  it.each([
    { name: 'an error payload', response: { error: { message: 'denied' } } },
    { name: 'an empty response', response: null },
    { name: 'a response with neither url nor paper id', response: {} },
  ])('throws the request error on $name', async ({ response }) => {
    mocks.save.mockResolvedValue(response);
    await expect(savePreliminaryValues(values(), true)).rejects.toThrow(
      PreliminaryRequestError
    );
  });

  it('preserves the backend error for a stale revision', async () => {
    const backendError = {
      name: 'ValidationError',
      message: 'The paper changed while it was being saved.',
    };
    mocks.save.mockResolvedValue({ error: backendError });
    const failure = await savePreliminaryValues(values(), true).catch(
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(PreliminaryRequestError);
    expect((failure as PreliminaryRequestError).backendError).toEqual(
      backendError
    );
  });
});
