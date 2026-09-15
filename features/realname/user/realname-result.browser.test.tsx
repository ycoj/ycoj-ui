import RealnameResult from '@/features/realname/user/realname-result';
import type { RealnameResultData } from '@/shared/types/realname';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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

beforeEach(() => vi.clearAllMocks());

test('shows a pending application inside grace', async () => {
  await render(await RealnameResult({ data: baseData }));

  const status = page.getByText('Pending', { exact: true });
  await expect.element(status).toBeVisible();
  expect(status.element().getBoundingClientRect().height).toBeGreaterThan(0);
  await expect
    .element(page.getByText(/Available until/, { exact: false }))
    .toBeVisible();

  const backHome = page.getByRole('link', { name: 'Back to home' });
  await expect.element(backHome).toBeVisible();
  expect(backHome.element().getAttribute('href')).toBe('/home');
});

test('shows approved access', async () => {
  await render(
    await RealnameResult({
      data: { ...baseData, status: 'approved', inGrace: false },
    })
  );

  await expect
    .element(page.getByText('Approved', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('All features are available.', { exact: true }))
    .toBeVisible();
});

test('shows rejection reason and expired access', async () => {
  await render(
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

  await expect
    .element(page.getByText('Rejected', { exact: true }))
    .toBeVisible();
  await expect
    .element(
      page.getByText('Reason: Information is incomplete', { exact: true })
    )
    .toBeVisible();
  await expect
    .element(page.getByText('Resubmit to regain access.', { exact: true }))
    .toBeVisible();
});
