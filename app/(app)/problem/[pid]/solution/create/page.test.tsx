import ProblemSolutionCreatePage from './page';
import { PERM } from '@/features/user/lib/priv';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  get: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('@/features/problem/detail/get-problem-detail', () => ({
  getProblemDetail: vi.fn(),
}));
vi.mock('@/features/problem/solution/get-problem-solution', () => ({
  getProblemSolution: mocks.get,
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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({
    perm: `BigInt::${PERM.PERM_CREATE_PROBLEM_SOLUTION}`,
  });
  mocks.redirect.mockImplementation(() => {
    throw new Error('redirect');
  });
});

describe('direct solution creation', () => {
  it('shows the block notice instead of an editor for a blocked author', async () => {
    mocks.get.mockResolvedValue({ pdoc: { docId: 1 }, solutionBlocked: true });
    render(
      await ProblemSolutionCreatePage({
        params: Promise.resolve({ pid: 'P1' }),
      })
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      messages.solution.errors.blocked
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('allows an unblocked author to create a solution', async () => {
    mocks.get.mockResolvedValue({ pdoc: { docId: 1 }, solutionBlocked: false });
    render(
      await ProblemSolutionCreatePage({
        params: Promise.resolve({ pid: 'P1' }),
      })
    );
    expect(
      screen.getByRole('form', { name: 'Create solution' })
    ).toBeInTheDocument();
  });

  it('rejects authors without creation permission before loading solution data', async () => {
    mocks.user.mockResolvedValue({ perm: 'BigInt::0' });
    await expect(
      ProblemSolutionCreatePage({ params: Promise.resolve({ pid: 'P1' }) })
    ).rejects.toThrow('redirect');
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
