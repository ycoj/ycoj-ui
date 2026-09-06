import SolutionReviewWorkspace from './solution-review-workspace';
import type { SolutionReviewData } from '@/api/server/method/problems/solution-review';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import {
  NextIntlClientProvider,
  createTranslator,
  createFormatter,
} from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getTranslations: async () =>
    createTranslator({ locale: 'en', messages, namespace: 'solution.review' }),
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

const overview = {
  stats: { totalSolutions: 123, newToday: 5, pendingReview: 12 },
  pdict: {},
  udict: {},
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
    expect(screen.getByText('Unreviewed')).toBeVisible();
    expect(screen.getByText('UID 42')).toBeVisible();
    expect(screen.getByText('UID 43')).toBeVisible();
    expect(screen.getByRole('link', { name: 'View solution' })).toHaveAttribute(
      'href',
      '/problem/1/solution?sid=solution-id'
    );
    expect(screen.getByRole('button', { name: 'Approve' })).toBeVisible();
  });

  it('presents only the first blocked author and the unblock consequences', async () => {
    await mount({
      ...overview,
      status: 'authors',
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
    expect(screen.queryByText('UID 99')).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.solution.review.unblockConsequences)
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Unblock author' })
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Approve' })
    ).not.toBeInTheDocument();
  });

  it.each(['pending', 'authors'] as const)(
    'keeps counts and reload available for an empty %s view',
    async (status) => {
      await mount({ ...overview, status, docs: [] });
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
