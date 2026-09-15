import RealnameReviewList from '@/features/realname/manage/realname-review-list';
import messages from '@/messages/en';
import type { RealnameManageData } from '@/shared/types/realname';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  reviewRealname: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('@/api/client/method', () => ({
  default: { Realname: { reviewRealname: mocks.reviewRealname } },
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

vi.mock('@/features/user/user-span', () => ({
  default: ({ user }: { user: { uname: string } }) => <span>{user.uname}</span>,
}));

const application = {
  _id: 'application-id',
  uid: 2,
  realName: 'Alice Zhang',
  school: 'Example High School',
  status: 'pending' as const,
  submittedAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const data: RealnameManageData = {
  page_name: 'manage_realname',
  rdocs: [application],
  udict: {
    2: {
      _id: 2,
      uname: 'alice',
      mail: 'alice@example.com',
      avatar: 'avatar.png',
    },
  },
  page: 1,
  numPages: 1,
  count: 1,
  filterStatus: 'pending',
  filterUname: '',
};

function renderList(overrides: Partial<RealnameManageData> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <RealnameReviewList data={{ ...data, ...overrides }} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reviewRealname.mockReturnValue({
    send: vi.fn().mockResolvedValue({ url: '/manage/realname' }),
  });
});

test('approves a pending application after confirmation', async () => {
  await renderList();

  await userEvent.click(page.getByRole('button', { name: 'Approve' }));
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(
    dialog.getByRole('button', { name: 'Approve', exact: true })
  );

  await expect
    .poll(() => mocks.reviewRealname.mock.calls.length)
    .toBeGreaterThan(0);
  expect(mocks.reviewRealname).toHaveBeenCalledWith({
    operation: 'approve',
    id: 'application-id',
  });
  await expect.poll(() => mocks.refresh.mock.calls.length).toBe(1);
  expect(mocks.success).toHaveBeenCalledWith('Verification approved');
});

test('submits the optional rejection reason', async () => {
  await renderList();

  await userEvent.click(page.getByRole('button', { name: 'Reject' }));
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(
    dialog.getByLabelText('Reason (optional)'),
    'Name does not match'
  );
  await userEvent.click(
    dialog.getByRole('button', { name: 'Reject', exact: true })
  );

  await expect
    .poll(() => mocks.reviewRealname.mock.calls.length)
    .toBeGreaterThan(0);
  expect(mocks.reviewRealname).toHaveBeenCalledWith({
    operation: 'reject',
    id: 'application-id',
    reason: 'Name does not match',
  });
});

test('offers revoke only for approved applications', async () => {
  await renderList({
    rdocs: [{ ...application, status: 'approved' }],
    filterStatus: 'approved',
  });

  await expect
    .element(page.getByRole('button', { name: 'Revoke' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Approve' }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Reject' }))
    .not.toBeInTheDocument();
});
