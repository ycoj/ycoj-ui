import SolutionList from './solution-list';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import messages from '@/messages/en';
import type { SolutionDoc } from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));
vi.mock('./solution-vote', () => ({ default: () => <span>Voting</span> }));
vi.mock('./solution-delete-button', () => ({
  default: () => <button>Delete solution</button>,
}));

const reviewLabels: Record<string, string> = {
  '-1': 'Rejected and author blocked',
  '0': 'Rejected',
  '1': 'Unreviewed',
  '2': 'Approved',
  '3': 'Featured solution',
  '-2': 'Held for review',
};
const localizedLabels: Record<string, string> = messages.solution.status;

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
    reviewLabels,
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

test('keeps approved solutions visible and collapses all three unapproved states', async () => {
  const { container } = await mount([
    solution(3),
    solution(2),
    solution(1),
    solution(0),
    solution(-1),
  ]);

  await expect
    .element(page.getByText('Content 3', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('Content 2', { exact: true }))
    .toBeVisible();

  const disclosure = container.querySelector('details')!;
  expect(disclosure).not.toBeNull();
  expect(disclosure.hasAttribute('open')).toBe(false);
  for (const status of [1, 0, -1]) {
    await expect
      .element(page.getByText(`Content ${status}`, { exact: true }))
      .toBeInTheDocument();
  }

  await userEvent.click(page.getByText('Unapproved solutions (3)'));

  expect(disclosure.hasAttribute('open')).toBe(true);
  for (const status of ['3', '2', '1', '0', '-1']) {
    await expect
      .element(page.getByText(localizedLabels[status], { exact: true }))
      .toBeVisible();
  }
  await expect.poll(() => page.getByText('Voting').elements().length).toBe(5);
});

test('falls back to the backend label for a review status this client does not know', async () => {
  await mount([
    { ...solution(1), reviewStatus: -2 as SolutionDoc['reviewStatus'] },
  ]);

  await userEvent.click(page.getByText('Unapproved solutions (1)'));
  await expect
    .element(page.getByText(reviewLabels['-2'], { exact: true }))
    .toBeVisible();
});

test('preserves ownership-based edit and delete actions in the unapproved group', async () => {
  await mount([solution(0), solution(-1, 99)]);

  await userEvent.click(page.getByText('Unapproved solutions (2)'));

  const edit = page.getByRole('link', { name: 'Edit solution' });
  await expect.poll(() => edit.elements().length).toBe(1);
  expect(edit.element().getAttribute('href')).toBe(
    '/problem/P1/solution/solution-0/edit'
  );
  await expect
    .poll(
      () =>
        page.getByRole('button', { name: 'Delete solution' }).elements().length
    )
    .toBe(1);
});

test('shows an empty state without an empty disclosure', async () => {
  const { container } = await mount([]);

  await expect
    .element(page.getByText('No solutions', { exact: true }))
    .toBeVisible();
  expect(container.querySelector('details')).toBeNull();
});
