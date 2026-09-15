import ContestSolutionList from './contest-solution-list';
import messages from '@/messages/en.json';
import type { ComponentProps } from 'react';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: keyof typeof messages.contestSolution) =>
    messages.contestSolution[key],
  getFormatter: async () => ({ dateTime: () => 'September 5, 2026' }),
}));

const baseProps: ComponentProps<typeof ContestSolutionList> = {
  tid: 'contest',
  showContestSolutions: true,
  items: [{ docId: '65a1bc000000000000000000', title: 'Editorial', owner: 1 }],
  udict: {},
  canManage: false,
};

test('hides empty solutions from readers', async () => {
  expect(await ContestSolutionList({ ...baseProps, items: [] })).toBeNull();
});

test('hides the section when the backend does not grant visibility', async () => {
  expect(
    await ContestSolutionList({
      ...baseProps,
      showContestSolutions: undefined,
    })
  ).toBeNull();
});

test('shows published solutions without management controls for readers', async () => {
  await render(await ContestSolutionList(baseProps));

  const link = page.getByRole('link', { name: 'Editorial' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe(
    '/contest/contest/solution/65a1bc000000000000000000'
  );
  await expect
    .element(page.getByRole('link', { name: 'Create solution' }))
    .not.toBeInTheDocument();
});

test('lets managers create the first solution', async () => {
  await render(
    await ContestSolutionList({ ...baseProps, canManage: true, items: [] })
  );

  await expect
    .element(page.getByText('No solutions yet', { exact: true }))
    .toBeVisible();
  const create = page.getByRole('link', { name: 'Create solution' });
  await expect.element(create).toBeVisible();
  expect(create.element().getAttribute('href')).toBe(
    '/contest/contest/solution/create'
  );
});
