import ContestSolutionList from './contest-solution-list';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: keyof typeof messages.contestSolution) =>
    messages.contestSolution[key],
  getFormatter: async () => ({ dateTime: () => 'September 5, 2026' }),
}));

const baseProps: ComponentProps<typeof ContestSolutionList> = {
  tid: 'contest',
  rule: 'acm',
  showContestSolutions: true,
  items: [{ docId: '65a1bc000000000000000000', title: 'Editorial', owner: 1 }],
  udict: {},
  canManage: false,
};

describe('contest solution visibility', () => {
  it('hides empty solutions from readers', async () => {
    expect(await ContestSolutionList({ ...baseProps, items: [] })).toBeNull();
  });
  it('hides the section when the backend does not grant visibility', async () => {
    expect(
      await ContestSolutionList({
        ...baseProps,
        showContestSolutions: undefined,
      })
    ).toBeNull();
  });
  it('excludes homework', async () => {
    expect(
      await ContestSolutionList({ ...baseProps, rule: 'homework' })
    ).toBeNull();
  });
  it('shows published solutions without management controls for readers', async () => {
    render(await ContestSolutionList(baseProps));
    expect(screen.getByRole('link', { name: 'Editorial' })).toHaveAttribute(
      'href',
      '/contest/contest/solution/65a1bc000000000000000000'
    );
    expect(
      screen.queryByRole('link', { name: 'Create solution' })
    ).not.toBeInTheDocument();
  });
  it('lets managers create the first solution', async () => {
    render(
      await ContestSolutionList({ ...baseProps, canManage: true, items: [] })
    );
    expect(screen.getByText('No solutions yet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create solution' })
    ).toHaveAttribute('href', '/contest/contest/solution/create');
  });
  it('renders a fallback for malformed solution ids', async () => {
    render(
      await ContestSolutionList({
        ...baseProps,
        items: [{ docId: 'not-an-object-id', title: 'Broken', owner: 1 }],
      })
    );
    expect(screen.getByRole('link', { name: 'Broken' })).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
