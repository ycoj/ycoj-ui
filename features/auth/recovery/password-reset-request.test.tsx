import PasswordResetRequest from './password-reset-request';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/api/client/method', () => ({
  default: { Auth: { requestPasswordReset: mocks.request } },
}));
vi.mock('@/shared/components/site-footer', () => ({ default: () => null }));

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasswordResetRequest />
    </NextIntlClientProvider>
  );
}

describe('PasswordResetRequest', () => {
  beforeEach(() => vi.resetAllMocks());

  it('validates email before requesting a reset', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));
    expect(
      await screen.findByText('Enter a valid email address.')
    ).toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('shows confirmation after a successful request', async () => {
    mocks.request.mockReturnValue({ send: vi.fn().mockResolvedValue({}) });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith('alice@example.com')
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A password reset email has been sent'
    );
  });

  it('renders backend failures', async () => {
    mocks.request.mockReturnValue({
      send: vi
        .fn()
        .mockResolvedValue({ error: { message: 'Cannot send mail' } }),
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot send mail'
    );
  });
});
