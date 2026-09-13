import SolutionReviewPage, { generateMetadata } from './page';
import { PERM } from '@/features/user/lib/priv';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  get: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('@/api/server/method', () => ({
  default: { Problems: { getSolutionReview: mocks.get } },
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock('@/features/problem/solution/review/solution-review-workspace', () => ({
  default: ({ data }: { data: { status: string } }) => <div>{data.status}</div>,
}));
vi.mock('@/shared/components/errored', () => ({
  Errored: ({ error }: { error: { message: string } }) => (
    <p role="alert">{error.message}</p>
  ),
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.redirect.mockImplementation(() => {
    throw new Error('redirect');
  });
});

describe('solution review route', () => {
  it.each([
    undefined,
    { perm: `BigInt::${PERM.PERM_DELETE_PROBLEM_SOLUTION_SELF}` },
  ])(
    'does not claim a solution without moderation permission',
    async (user) => {
      mocks.user.mockResolvedValue(user);
      await expect(
        SolutionReviewPage({ searchParams: Promise.resolve({}) })
      ).rejects.toThrow('redirect');
      expect(mocks.redirect).toHaveBeenCalledWith('/problem');
      expect(mocks.get).not.toHaveBeenCalled();
    }
  );

  it.each([
    [undefined, 'pending'],
    ['authors', 'authors'],
    ['all', 'pending'],
  ])('loads the authorized %s view', async (status, expected) => {
    mocks.user.mockResolvedValue({
      perm: `BigInt::${PERM.PERM_DELETE_PROBLEM_SOLUTION}`,
    });
    mocks.get.mockResolvedValue({ status: expected });
    render(
      await SolutionReviewPage({ searchParams: Promise.resolve({ status }) })
    );
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith(expected);
    expect(screen.getByText(expected!)).toBeInTheDocument();
  });

  it('renders a backend authorization failure without a workspace', async () => {
    mocks.user.mockResolvedValue({
      perm: `BigInt::${PERM.PERM_DELETE_PROBLEM_SOLUTION}`,
    });
    mocks.get.mockResolvedValue({ error: { message: 'Permission denied' } });
    render(await SolutionReviewPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
  });

  it('does not claim a solution while generating metadata', async () => {
    await generateMetadata();
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
