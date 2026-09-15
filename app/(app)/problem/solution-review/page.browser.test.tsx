import SolutionReviewPage, { generateMetadata } from './page';
import { PERM } from '@/features/user/lib/priv';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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

test.each([
  undefined,
  { perm: `BigInt::${PERM.PERM_DELETE_PROBLEM_SOLUTION_SELF}` },
])('does not claim a solution without moderation permission', async (user) => {
  mocks.user.mockResolvedValue(user);

  await expect(
    SolutionReviewPage({ searchParams: Promise.resolve({}) })
  ).rejects.toThrow('redirect');
  expect(mocks.redirect).toHaveBeenCalledWith('/problem');
  expect(mocks.get).not.toHaveBeenCalled();
});

test.each([
  [undefined, 'pending'],
  ['authors', 'authors'],
  ['featured', 'featured'],
  ['blocked', 'blocked'],
  ['all', 'all'],
  ['bogus', 'pending'],
])('loads the %s view as %s', async (status, expected) => {
  mocks.user.mockResolvedValue({
    perm: `BigInt::${PERM.PERM_DELETE_PROBLEM_SOLUTION}`,
  });
  mocks.get.mockResolvedValue({ status: expected });
  await render(
    await SolutionReviewPage({ searchParams: Promise.resolve({ status }) })
  );

  expect(mocks.get).toHaveBeenCalledExactlyOnceWith(expected);
  await expect
    .element(page.getByText(expected!, { exact: true }))
    .toBeVisible();
});

test('renders a backend authorization failure without a workspace', async () => {
  mocks.user.mockResolvedValue({
    perm: `BigInt::${PERM.PERM_DELETE_PROBLEM_SOLUTION}`,
  });
  mocks.get.mockResolvedValue({ error: { message: 'Permission denied' } });
  await render(await SolutionReviewPage({ searchParams: Promise.resolve({}) }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
});

test('does not claim a solution while generating metadata', async () => {
  await generateMetadata();
  expect(mocks.get).not.toHaveBeenCalled();
});
