import ContestSolutionList from './contest-solution-list';
import type { ContestDetailResponse } from '@/api/server/method/contests/detail';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: keyof typeof messages.contestSolution) =>
    messages.contestSolution[key],
  getFormatter: async () => ({ dateTime: () => 'September 5, 2026' }),
}));
const data: ContestDetailResponse = {
  tdoc: {
    _id: 'contest',
    docId: 'contest',
    docType: 30,
    domainId: 'system',
    owner: 1,
    title: 'Contest',
    content: '',
    rule: 'acm',
    beginAt: new Date(),
    endAt: new Date(),
    attend: 0,
    pids: [],
    duration: 0,
  },
  tsdoc: null,
  udict: {},
  files: [],
  showContestSolutions: true,
  canManage: false,
  csdocs: [{ docId: '65a1bc000000000000000000', title: 'Editorial', owner: 1 }],
};

describe('contest solution visibility', () => {
  it.each([[], undefined])(
    'hides empty solutions from readers (%s)',
    async (csdocs) => {
      expect(
        await ContestSolutionList({ tid: 'contest', data: { ...data, csdocs } })
      ).toBeNull();
    }
  );
  it('hides the section when the backend does not grant visibility', async () => {
    expect(
      await ContestSolutionList({
        tid: 'contest',
        data: { ...data, showContestSolutions: undefined },
      })
    ).toBeNull();
  });
  it('excludes homework', async () => {
    expect(
      await ContestSolutionList({
        tid: 'contest',
        data: { ...data, tdoc: { ...data.tdoc, rule: 'homework' } },
      })
    ).toBeNull();
  });
  it('shows published solutions without management controls for readers', async () => {
    render(await ContestSolutionList({ tid: 'contest', data }));
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
      await ContestSolutionList({
        tid: 'contest',
        data: { ...data, canManage: true, csdocs: [] },
      })
    );
    expect(screen.getByText('No solutions yet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create solution' })
    ).toHaveAttribute('href', '/contest/contest/solution/create');
  });
});
