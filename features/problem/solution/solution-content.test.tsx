import SolutionContent from './solution-content';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { PERM } from '@/features/user/lib/priv';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ user: vi.fn() }));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('next-intl/server', () => ({
  getTranslations: async () =>
    createTranslator({ locale: 'en', messages, namespace: 'solution' }),
}));
vi.mock('./solution-list', () => ({
  default: () => <p>Existing solutions</p>,
}));

beforeEach(() => {
  mocks.user.mockResolvedValue({
    _id: 42,
    perm: `BigInt::${PERM.PERM_CREATE_PROBLEM_SOLUTION}`,
  });
});

describe('solution creation entry', () => {
  it.each([true, false])(
    'respects submission block state %s while keeping existing solutions readable',
    async (solutionBlocked) => {
      const data = {
        pdoc: { docId: 1 },
        solutionBlocked,
      } as ProblemSolutionResponse;
      render(await SolutionContent({ data }));
      expect(screen.getByText('Existing solutions')).toBeVisible();
      if (solutionBlocked) {
        expect(screen.getByRole('status')).toHaveTextContent(
          messages.solution.errors.blocked
        );
        expect(
          screen.queryByRole('link', { name: 'Create solution' })
        ).not.toBeInTheDocument();
      } else {
        expect(
          screen.getByRole('link', { name: 'Create solution' })
        ).toHaveAttribute('href', '/problem/1/solution/create');
      }
    }
  );
});
