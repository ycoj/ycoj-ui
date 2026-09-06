import SolutionList from './solution-list';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import messages from '@/messages/en.json';
import type { SolutionDoc } from '@/shared/types/problem';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));
vi.mock('./solution-vote', () => ({ default: () => <span>Voting</span> }));
vi.mock('./solution-delete-button', () => ({
  default: () => <button>Delete solution</button>,
}));

function solution(
  status: SolutionDoc['reviewStatus'],
  owner = 42
): SolutionDoc {
  return {
    _id: '66d9b8800000000000000001',
    docId: `solution-${status}`,
    docType: 15,
    domainId: 'system',
    owner,
    content: `Content ${status}`,
    parentId: 1,
    parentType: 10,
    reply: [],
    vote: 0,
    reviewStatus: status,
    revision: 0,
  };
}

function mount(docs: SolutionDoc[]) {
  const data = {
    psdocs: docs,
    pdoc: { docId: 1, pid: 'P1' },
    udict: {},
    pssdict: {},
    solutionBlocked: false,
  } as ProblemSolutionResponse;
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SolutionList
        data={data}
        viewerId={42}
        allowEditAny={false}
        allowEditSelf
        allowDeleteAny={false}
        allowDeleteSelf
      />
    </NextIntlClientProvider>
  );
}

describe('solution review visibility', () => {
  it('keeps approved solutions visible and collapses all three unapproved states', async () => {
    const { container } = mount([
      solution(3),
      solution(2),
      solution(1),
      solution(0),
      solution(-1),
    ]);
    expect(screen.getByText('Content 3')).toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
    const disclosure = container.querySelector('details')!;
    expect(disclosure).not.toHaveAttribute('open');
    for (const status of [1, 0, -1])
      expect(
        within(disclosure).getByText(`Content ${status}`)
      ).toBeInTheDocument();
    await userEvent.click(screen.getByText('Unapproved solutions (3)'));
    expect(disclosure).toHaveAttribute('open');
    for (const label of Object.values(messages.solution.status))
      expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getAllByText('Voting')).toHaveLength(5);
  });

  it('preserves ownership-based edit and delete actions in the unapproved group', async () => {
    mount([solution(0), solution(-1, 99)]);
    await userEvent.click(screen.getByText('Unapproved solutions (2)'));
    expect(screen.getAllByRole('link', { name: 'Edit solution' })).toHaveLength(
      1
    );
    expect(screen.getByRole('link', { name: 'Edit solution' })).toHaveAttribute(
      'href',
      '/problem/P1/solution/solution-0/edit'
    );
    expect(
      screen.getAllByRole('button', { name: 'Delete solution' })
    ).toHaveLength(1);
  });

  it('shows an empty state without an empty disclosure', () => {
    const { container } = mount([]);
    expect(screen.getByText('No solutions')).toBeVisible();
    expect(container.querySelector('details')).toBeNull();
  });
});
