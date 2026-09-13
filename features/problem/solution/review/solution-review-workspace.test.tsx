import SolutionReviewWorkspace from './solution-review-workspace';
import type { SolutionReviewData } from '@/api/server/method/problems/solution-review';
import messages from '@/messages/en.json';
import { render, screen, within } from '@testing-library/react';
import {
  NextIntlClientProvider,
  createTranslator,
  createFormatter,
} from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

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
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {await SolutionReviewWorkspace({ data })}
    </NextIntlClientProvider>
  );
}

describe('solution review workspace', () => {
  it('renders the claimed content, counts, metadata, and exact solution link', async () => {
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
    expect(screen.getByText('Review this answer')).toBeVisible();
    expect(screen.getByText('123')).toBeVisible();
    expect(
      within(
        screen.getByText(messages.solution.review.status).parentElement!
      ).getByText('Unreviewed')
    ).toBeVisible();
    expect(screen.getByText('UID 42')).toBeVisible();
    expect(screen.getByText('UID 43')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View solution' })).toHaveAttribute(
      'href',
      '/problem/1/solution?sid=solution-id'
    );
    expect(screen.getByRole('button', { name: 'Approve' })).toBeVisible();
  });

  it('lists every blocked author with its own unblock action', async () => {
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
    expect(screen.getByText('UID 42')).toBeVisible();
    expect(screen.getByText('UID 43')).toBeVisible();
    expect(screen.getByText('UID 99')).toBeVisible();
    expect(screen.getByText('Blocked solution authors (2)')).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Unblock author' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Reload review queue' })
    ).toHaveLength(1);
    expect(
      screen.getByText(messages.solution.review.unblockConsequences)
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Approve' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', {
        name: messages.solution.review.filter,
      })
    ).not.toBeInTheDocument();
  });

  it('links every review-queue status and marks the active filter', async () => {
    await mount({ ...overview, status: 'pending', docs: [] });
    const filters = screen.getByRole('navigation', {
      name: messages.solution.review.filter,
    });
    expect(
      within(filters).getByRole('link', { name: 'Unreviewed' })
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(filters).getByRole('link', { name: 'Rejected and author blocked' })
    ).toHaveAttribute('href', '/problem/solution-review?status=blocked');
    expect(
      within(filters).getByRole('link', { name: 'All solutions' })
    ).toHaveAttribute('href', '/problem/solution-review?status=all');
    expect(within(filters).getAllByRole('link')).toHaveLength(6);
  });

  it('offers unblock instead of a verdict for a claimed blocked solution', async () => {
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
    expect(
      within(
        screen.getByText(messages.solution.review.status).parentElement!
      ).getByText('Rejected and author blocked')
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Unblock author' })
    ).toBeVisible();
    for (const name of [
      'Approve',
      'Reject',
      'Feature solution',
      'Block author',
    ])
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  });

  it.each(['pending', 'authors'] as const)(
    'keeps counts and reload available for an empty %s view',
    async (status) => {
      await mount({ ...overview, status, count: 0, docs: [] });
      expect(
        screen.getByText(
          status === 'pending'
            ? messages.solution.review.empty
            : messages.solution.review.noAuthors
        )
      ).toBeVisible();
      expect(screen.getByText('123')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Reload review queue' })
      ).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Unblock author' })
      ).not.toBeInTheDocument();
    }
  );
});
