import ProblemFeedbackList from './problem-feedback-list';
import messages from '@/messages/en';
import type { ProblemFeedbackManageData } from '@/shared/types/problem-feedback';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { updateProblemFeedbackStatus: mocks.update } },
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

vi.mock('@/features/user/user-span', () => ({
  default: ({ user }: { user: { uname: string } }) => <span>{user.uname}</span>,
}));

const data: ProblemFeedbackManageData = {
  page_name: 'manage_problem_feedback',
  docs: [
    {
      _id: 'feedback-id',
      domainId: 'system',
      pid: 1000,
      owner: 2,
      content: 'The sample output is incorrect.',
      status: 'pending',
      createdAt: '2026-09-18T18:00:00.000Z',
      updatedAt: '2026-09-18T18:00:00.000Z',
    },
  ],
  page: 1,
  pcount: 1,
  count: 1,
  pdict: {
    1000: { docId: 1000, pid: 'P1000', title: 'A+B Problem' } as never,
  },
  udict: {
    2: {
      _id: 2,
      uname: 'alice',
      mail: 'alice@example.com',
      avatar: 'avatar.png',
    },
  },
  status: 'pending',
};

describe('ProblemFeedbackList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockReturnValue({ send: vi.fn().mockResolvedValue({}) });
  });

  it('shows the report and changes its status', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ProblemFeedbackList data={data} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('A+B Problem')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(
      screen.getByText('The sample output is incorrect.')
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('combobox', { name: 'Status for A+B Problem' })
    );
    await user.click(screen.getByRole('option', { name: 'Processing' }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith('feedback-id', 'processing')
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith('Feedback status updated.');
  });
});
