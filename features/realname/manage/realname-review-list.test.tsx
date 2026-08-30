import RealnameReviewList from './realname-review-list';
import messages from '@/messages/en.json';
import type { RealnameManageData } from '@/shared/types/realname';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('RealnameReviewList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reviewRealname.mockReturnValue({
      send: vi.fn().mockResolvedValue({ url: '/manage/realname' }),
    });
  });

  it('approves a pending application after confirmation', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(mocks.reviewRealname).toHaveBeenCalledWith({
        operation: 'approve',
        id: 'application-id',
      })
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith('Verification approved');
  });

  it('submits the optional rejection reason', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog');
    await user.type(
      within(dialog).getByLabelText('Reason (optional)'),
      'Name does not match'
    );
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    await waitFor(() =>
      expect(mocks.reviewRealname).toHaveBeenCalledWith({
        operation: 'reject',
        id: 'application-id',
        reason: 'Name does not match',
      })
    );
  });

  it('offers revoke only for approved applications', () => {
    renderList({
      rdocs: [{ ...application, status: 'approved' }],
      filterStatus: 'approved',
    });

    expect(screen.getByRole('button', { name: 'Revoke' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull();
  });
});
