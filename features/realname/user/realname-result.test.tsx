import RealnameResult from '@/features/realname/user/realname-result';
import type { RealnameResultData } from '@/shared/types/realname';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const translations: Record<string, string> = {
  resultTitle: 'Verification result',
  'status.pending': 'Pending',
  'status.approved': 'Approved',
  'status.rejected': 'Rejected',
  'status.pendingTitle': 'Awaiting review',
  'status.approvedTitle': 'Verification approved',
  'status.rejectedTitle': 'Verification rejected',
  'status.approvedDescription': 'All features are available.',
  'grace.title': 'Grace period',
  'grace.expiredTitle': 'Grace period ended',
  'grace.pendingExpired': 'Access is blocked.',
  'grace.rejectedExpired': 'Resubmit to regain access.',
  'form.realName': 'Legal name',
  'form.school': 'School',
  submittedAt: 'Submitted',
  reviewedAt: 'Reviewed',
  resubmit: 'Resubmit',
  'form.update': 'Update verification',
  backHome: 'Back to home',
};

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi
    .fn()
    .mockResolvedValue((key: string, values?: Record<string, string>) => {
      if (key === 'grace.until') return `Available until ${values?.deadline}`;
      if (key === 'reasonWithValue') return `Reason: ${values?.reason}`;
      return translations[key] ?? key;
    }),
}));

const baseData: RealnameResultData = {
  page_name: 'home_realname_result',
  status: 'pending',
  exempt: false,
  application: {
    _id: 'application-id',
    uid: 2,
    realName: 'Alice Zhang',
    school: 'Example High School',
    status: 'pending',
    submittedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  inGrace: true,
  graceUntil: '2026-08-08T00:00:00.000Z',
};

describe('RealnameResult', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a pending application inside grace', async () => {
    render(await RealnameResult({ data: baseData }));

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText(/Available until/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to home' })
    ).toBeInTheDocument();
  });

  it('shows approved access', async () => {
    render(
      await RealnameResult({
        data: { ...baseData, status: 'approved', inGrace: false },
      })
    );

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('All features are available.')).toBeInTheDocument();
  });

  it('shows rejection reason and expired access', async () => {
    render(
      await RealnameResult({
        data: {
          ...baseData,
          status: 'rejected',
          inGrace: false,
          application: {
            ...baseData.application!,
            status: 'rejected',
            rejectReason: 'Information is incomplete',
          },
        },
      })
    );

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(
      screen.getByText('Reason: Information is incomplete')
    ).toBeInTheDocument();
    expect(screen.getByText('Resubmit to regain access.')).toBeInTheDocument();
  });
});
