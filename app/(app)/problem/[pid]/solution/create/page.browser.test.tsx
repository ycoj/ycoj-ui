import ProblemSolutionCreatePage from './page';
import { PERM } from '@/features/user/lib/priv';
import messages from '@/messages/en';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  detail: vi.fn(),
  solutions: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('@/features/problem/detail/get-problem-detail', () => ({
  getProblemDetail: mocks.detail,
}));
vi.mock('@/features/problem/solution/get-problem-solution', () => ({
  getProblemSolution: mocks.solutions,
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) =>
    key === 'errors.blocked' ? messages.solution.errors.blocked : key,
}));
vi.mock('@/features/problem/detail/problem-title', () => ({
  default: () => <h1>Problem</h1>,
}));
vi.mock('@/features/problem/solution/solution-create-form', () => ({
  default: () => <form aria-label="Create solution" />,
}));
vi.mock('@/shared/components/errored', () => ({
  Errored: ({ error }: { error: { message: string } }) => (
    <p role="alert">{error.message}</p>
  ),
}));

function renderPage() {
  return ProblemSolutionCreatePage({
    params: Promise.resolve({ pid: 'P1' }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({
    perm: `BigInt::${PERM.PERM_CREATE_PROBLEM_SOLUTION}`,
  });
  mocks.detail.mockResolvedValue({ pdoc: { docId: 1 } });
  mocks.solutions.mockResolvedValue({ solutionBlocked: false });
  mocks.redirect.mockImplementation(() => {
    throw new Error('redirect');
  });
});

test('shows the block notice instead of an editor for a blocked author', async () => {
  mocks.solutions.mockResolvedValue({ solutionBlocked: true });
  await render(await renderPage());

  const status = page.getByRole('status');
  await expect.element(status).toBeVisible();
  await expect
    .element(status)
    .toHaveTextContent(messages.solution.errors.blocked);
  await expect.element(page.getByRole('form')).not.toBeInTheDocument();
});

test('allows an unblocked author to create a solution', async () => {
  await render(await renderPage());

  await expect
    .element(page.getByRole('form', { name: 'Create solution' }))
    .toBeInTheDocument();
});

test('keeps the editor when the solution list is not readable', async () => {
  mocks.solutions.mockResolvedValue({
    error: { name: 'PermissionError', message: 'Permission denied' },
  });
  await render(await renderPage());

  await expect
    .element(page.getByRole('form', { name: 'Create solution' }))
    .toBeInTheDocument();
  await expect.element(page.getByRole('status')).not.toBeInTheDocument();
});

test('rejects authors without creation permission before loading problem data', async () => {
  mocks.user.mockResolvedValue({ perm: 'BigInt::0' });

  await expect(renderPage()).rejects.toThrow('redirect');
  expect(mocks.detail).not.toHaveBeenCalled();
  expect(mocks.solutions).not.toHaveBeenCalled();
});
