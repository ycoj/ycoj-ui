import SolutionReviewWorkspace from './solution-review-workspace';
import type { SolutionReviewData } from '@/api/server/method/problems/solution-review';
import messages from '@/messages/en';
import {
  NextIntlClientProvider,
  createFormatter,
  createTranslator,
} from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: 'solution.review' | 'solution') =>
    createTranslator({ locale: 'en', messages, namespace }),
  getFormatter: async () => createFormatter({ locale: 'en', timeZone: 'UTC' }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/api/client/method', () => ({ default: {} }));
vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <p>{children}</p>,
}));
vi.mock('@/features/user/user-span', () => ({
  default: ({ user }: { user: { uname: string } }) => <span>{user.uname}</span>,
}));

const reviewLabels = {
  '-1': 'Rejected and author blocked',
  '0': 'Rejected',
  '1': 'Unreviewed',
  '2': 'Approved',
  '3': 'Featured Solution',
};
const overview = {
  page: 1,
  pcount: 1,
  count: 1,
  stats: { totalSolutions: 123, newToday: 5, pendingReview: 12 },
  pdict: {},
  udict: {},
  reviewLabels,
};

async function mount(data: SolutionReviewData) {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {await SolutionReviewWorkspace({ data })}
    </NextIntlClientProvider>
  );
}

test('renders the claimed content, counts, metadata, and exact solution link', async () => {
  await mount({
    ...overview,
    status: 'pending',
    docs: [
      {
        _id: '66d9b8800000000000000001',
        docId: 'solution-id',
        docType: 15,
        domainId: 'system',
        owner: 42,
        content: 'Review this answer',
        parentId: 1,
        parentType: 10,
        reply: [],
        vote: 8,
        reviewStatus: 1,
        revision: 0,
        reviewLockUntil: '2026-09-05T12:01:00Z',
        reviewedBy: 43,
        reviewedAt: '2026-09-05T12:00:00Z',
      },
    ],
  });

  await expect
    .element(page.getByText('Review this answer', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('123', { exact: true })).toBeVisible();
  const statusRow = page
    .getByText(messages.solution.review.status, { exact: true })
    .element().parentElement!;
  expect(statusRow.textContent).toContain('Unreviewed');
  await expect.element(page.getByText('UID 42', { exact: true })).toBeVisible();
  await expect.element(page.getByText('UID 43', { exact: true })).toBeVisible();

  const solutionLink = page.getByRole('link', { name: 'View solution' });
  await expect.element(solutionLink).toBeVisible();
  expect(solutionLink.element().getAttribute('href')).toBe(
    '/problem/1/solution?sid=solution-id'
  );
  await expect
    .element(page.getByRole('button', { name: 'Approve' }))
    .toBeVisible();
});

test('lists every blocked author with its own unblock action', async () => {
  await mount({
    ...overview,
    status: 'authors',
    count: 2,
    docs: [
      {
        uid: 42,
        domainId: 'system',
        solutionBlocked: true,
        solutionBlockedBy: 43,
        solutionBlockedAt: '2026-09-05T12:00:00Z',
      },
      { uid: 99, domainId: 'system', solutionBlocked: true },
    ],
  });

  await expect.element(page.getByText('UID 42', { exact: true })).toBeVisible();
  await expect.element(page.getByText('UID 43', { exact: true })).toBeVisible();
  await expect.element(page.getByText('UID 99', { exact: true })).toBeVisible();
  await expect
    .element(page.getByText('Blocked solution authors (2)', { exact: true }))
    .toBeVisible();
  await expect
    .poll(
      () =>
        page.getByRole('button', { name: 'Unblock author' }).elements().length
    )
    .toBe(2);
  await expect
    .poll(
      () =>
        page.getByRole('button', { name: 'Reload review queue' }).elements()
          .length
    )
    .toBe(1);
  await expect
    .element(
      page.getByText(messages.solution.review.unblockConsequences, {
        exact: true,
      })
    )
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Approve' }))
    .not.toBeInTheDocument();
  await expect
    .element(
      page.getByRole('navigation', { name: messages.solution.review.filter })
    )
    .not.toBeInTheDocument();
});

test('links every review-queue status and marks the active filter', async () => {
  await mount({ ...overview, status: 'pending', docs: [] });

  const filters = page.getByRole('navigation', {
    name: messages.solution.review.filter,
  });
  await expect.element(filters).toBeVisible();

  const active = filters.getByRole('link', { name: 'Unreviewed' });
  await expect.element(active).toBeVisible();
  expect(active.element().getAttribute('aria-current')).toBe('page');

  const blocked = filters.getByRole('link', {
    name: 'Rejected and author blocked',
  });
  await expect.element(blocked).toBeVisible();
  expect(blocked.element().getAttribute('href')).toBe(
    '/problem/solution-review?status=blocked'
  );

  const all = filters.getByRole('link', { name: 'All solutions' });
  await expect.element(all).toBeVisible();
  expect(all.element().getAttribute('href')).toBe(
    '/problem/solution-review?status=all'
  );

  await expect.poll(() => filters.getByRole('link').elements().length).toBe(6);
});

test('offers unblock instead of a verdict for a claimed blocked solution', async () => {
  await mount({
    ...overview,
    status: 'blocked',
    docs: [
      {
        _id: '66d9b8800000000000000002',
        docId: 'blocked-id',
        docType: 15,
        domainId: 'system',
        owner: 42,
        content: 'Blocked answer',
        parentId: 1,
        parentType: 10,
        reply: [],
        vote: 0,
        reviewStatus: -1,
        revision: 2,
        reviewLockUntil: '2026-09-05T12:01:00Z',
      },
    ],
  });

  const statusRow = page
    .getByText(messages.solution.review.status, { exact: true })
    .element().parentElement!;
  expect(statusRow.textContent).toContain('Rejected and author blocked');
  await expect
    .element(page.getByRole('button', { name: 'Unblock author' }))
    .toBeVisible();
  for (const name of [
    'Approve',
    'Reject',
    'Feature solution',
    'Block author',
  ]) {
    await expect
      .element(page.getByRole('button', { name, exact: true }))
      .not.toBeInTheDocument();
  }
});

test.each(['pending', 'authors'] as const)(
  'keeps counts and reload available for an empty %s view',
  async (status) => {
    await mount({ ...overview, status, count: 0, docs: [] });

    await expect
      .element(
        page.getByText(
          status === 'pending'
            ? messages.solution.review.empty
            : messages.solution.review.noAuthors,
          { exact: true }
        )
      )
      .toBeVisible();
    await expect.element(page.getByText('123', { exact: true })).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Reload review queue' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Unblock author' }))
      .not.toBeInTheDocument();
  }
);
