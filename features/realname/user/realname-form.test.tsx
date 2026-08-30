import RealnameForm from './realname-form';
import messages from '@/messages/en.json';
import type { RealnamePageData } from '@/shared/types/realname';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  submitRealname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock('@/api/client/method', () => ({
  default: { Realname: { submitRealname: mocks.submitRealname } },
}));

const data: RealnamePageData = {
  page_name: 'home_realname',
  status: 'pending',
  exempt: false,
  application: null,
  inGrace: true,
  graceUntil: '2026-08-08T00:00:00.000Z',
  realName: 'Alice Zhang',
  school: 'Example High School',
};

function renderForm(overrides: Partial<RealnamePageData> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <RealnameForm data={{ ...data, ...overrides }} />
    </NextIntlClientProvider>
  );
}

describe('RealnameForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills and submits the legal name and school', async () => {
    const send = vi.fn().mockResolvedValue({ url: '/home/realname/result' });
    mocks.submitRealname.mockReturnValue({ send });
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText('Legal name')).toHaveValue('Alice Zhang');
    expect(screen.getByLabelText('School')).toHaveValue('Example High School');
    await user.click(
      screen.getByRole('button', { name: 'Update verification' })
    );

    await waitFor(() =>
      expect(mocks.submitRealname).toHaveBeenCalledWith({
        realName: 'Alice Zhang',
        school: 'Example High School',
      })
    );
    expect(send).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith('/home/realname/result');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('validates both fields before sending', async () => {
    const user = userEvent.setup();
    renderForm({ realName: '', school: '' });

    await user.click(
      screen.getByRole('button', { name: 'Update verification' })
    );

    expect(
      await screen.findByText('Legal name must be at least 2 characters')
    ).toBeInTheDocument();
    expect(
      screen.getByText('School name must be at least 2 characters')
    ).toBeInTheDocument();
    expect(mocks.submitRealname).not.toHaveBeenCalled();
  });

  it('shows a rejected reason and reports request failures', async () => {
    mocks.submitRealname.mockReturnValue({
      send: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')),
    });
    const user = userEvent.setup();
    renderForm({
      status: 'rejected',
      application: {
        _id: 'application-id',
        uid: 2,
        realName: 'Alice Zhang',
        school: 'Example High School',
        status: 'rejected',
        submittedAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-02T00:00:00.000Z',
        rejectReason: 'Name does not match',
      },
    });

    expect(screen.getByText('Reason: Name does not match')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Update verification' })
    );

    expect(await screen.findByText('Rate limit exceeded')).toHaveAttribute(
      'role',
      'alert'
    );
  });
});
