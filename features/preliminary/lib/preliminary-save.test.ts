import { PreliminaryRequestError } from './preliminary-error';
import { savePreliminaryValues } from './preliminary-save';
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

  it.each([
    { name: 'an error payload', response: { error: { message: 'denied' } } },
    {
      name: 'a response without a paper id',
      response: { url: '/preliminary/x' },
    },
    { name: 'an empty response', response: null },
  ])('throws the request error on $name', async ({ response }) => {
    mocks.save.mockResolvedValue(response);
    await expect(savePreliminaryValues(values(), true)).rejects.toThrow(
      PreliminaryRequestError
    );
  });
});
