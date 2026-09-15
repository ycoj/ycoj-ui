import SolutionContent from './solution-content';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { PERM } from '@/features/user/lib/priv';
import messages from '@/messages/en';
import { createTranslator } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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

test.each([true, false])(
  'respects submission block state %s while keeping existing solutions readable',
  async (solutionBlocked) => {
    const data = {
      pdoc: { docId: 1 },
      reviewLabels: {},
      solutionBlocked,
    } as ProblemSolutionResponse;
    await render(await SolutionContent({ data }));

    await expect
      .element(page.getByText('Existing solutions', { exact: true }))
      .toBeVisible();
    if (solutionBlocked) {
      const status = page.getByRole('status');
      await expect.element(status).toBeVisible();
      await expect
        .element(status)
        .toHaveTextContent(messages.solution.errors.blocked);
      await expect
        .element(page.getByRole('link', { name: 'Create solution' }))
        .not.toBeInTheDocument();
    } else {
      const create = page.getByRole('link', { name: 'Create solution' });
      await expect.element(create).toBeVisible();
      expect(create.element().getAttribute('href')).toBe(
        '/problem/1/solution/create'
      );
    }
  }
);
