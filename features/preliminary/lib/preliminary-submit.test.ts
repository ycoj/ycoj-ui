import {
  PreliminaryRequestError,
  submitPreliminaryAnswers,
} from './preliminary-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Preliminary: {
      submitPreliminary: (
        paperId: string,
        revision: number,
        answers: unknown
      ) => ({
        send: () => mocks.submit(paperId, revision, answers),
      }),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitPreliminaryAnswers', () => {
  it('returns the attempt url and clears the draft', async () => {
    mocks.submit.mockResolvedValue({ url: '/preliminary/p1/attempt/a1' });
    const clearAnswers = vi.fn(() => Promise.resolve());
    await expect(
      submitPreliminaryAnswers('p1', 2, { q1: 'o1' }, clearAnswers)
    ).resolves.toBe('/preliminary/p1/attempt/a1');
    expect(mocks.submit).toHaveBeenCalledWith('p1', 2, { q1: 'o1' });
    expect(clearAnswers).toHaveBeenCalled();
  });

  it('still returns the url when draft cleanup fails', async () => {
    mocks.submit.mockResolvedValue({ url: '/preliminary/p1/attempt/a1' });
    const clearAnswers = vi.fn(() => Promise.reject(new Error('no idb')));
    await expect(
      submitPreliminaryAnswers('p1', 2, {}, clearAnswers)
    ).resolves.toBe('/preliminary/p1/attempt/a1');
  });

  it('strips the domain prefix from the backend url, preserving the query', async () => {
    mocks.submit.mockResolvedValue({
      url: '/d/system/preliminary/p1/attempt/a1?from=submit',
    });
    const clearAnswers = vi.fn(() => Promise.resolve());
    await expect(
      submitPreliminaryAnswers('p1', 2, {}, clearAnswers)
    ).resolves.toBe('/preliminary/p1/attempt/a1?from=submit');
    expect(clearAnswers).toHaveBeenCalled();
  });

  it.each([
    { name: 'an error payload', response: { error: { message: 'denied' } } },
    {
      name: 'a response without a url',
      response: { attemptId: 'a1', score: 1, totalScore: 2 },
    },
    { name: 'an empty response', response: null },
  ])('throws the request error on $name', async ({ response }) => {
    mocks.submit.mockResolvedValue(response);
    const clearAnswers = vi.fn(() => Promise.resolve());
    await expect(
      submitPreliminaryAnswers('p1', 2, {}, clearAnswers)
    ).rejects.toThrow(PreliminaryRequestError);
    expect(clearAnswers).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'a stale revision',
      backendError: { name: 'ValidationError', message: 'stale' },
    },
    {
      name: 'rate limiting',
      backendError: { name: 'OpcountExceededError', message: 'too fast' },
    },
  ])('preserves the backend error on $name', async ({ backendError }) => {
    mocks.submit.mockResolvedValue({ error: backendError });
    const clearAnswers = vi.fn(() => Promise.resolve());
    const failure = await submitPreliminaryAnswers(
      'p1',
      2,
      {},
      clearAnswers
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(PreliminaryRequestError);
    expect((failure as PreliminaryRequestError).backendError).toEqual(
      backendError
    );
    expect(clearAnswers).not.toHaveBeenCalled();
  });
});
