import ProblemSolutionCreatePage from './page';
import { PERM } from '@/features/user/lib/priv';
import messages from '@/messages/en';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('direct solution creation', () => {
  it('shows the block notice instead of an editor for a blocked author', async () => {
    mocks.solutions.mockResolvedValue({ solutionBlocked: true });
    render(await renderPage());
    expect(screen.getByRole('status')).toHaveTextContent(
      messages.solution.errors.blocked
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('allows an unblocked author to create a solution', async () => {
    render(await renderPage());
    expect(
      screen.getByRole('form', { name: 'Create solution' })
    ).toBeInTheDocument();
  });

  it('keeps the editor when the solution list is not readable', async () => {
    mocks.solutions.mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    render(await renderPage());
    expect(
      screen.getByRole('form', { name: 'Create solution' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('rejects authors without creation permission before loading problem data', async () => {
    mocks.user.mockResolvedValue({ perm: 'BigInt::0' });
    await expect(renderPage()).rejects.toThrow('redirect');
    expect(mocks.detail).not.toHaveBeenCalled();
    expect(mocks.solutions).not.toHaveBeenCalled();
  });
});
