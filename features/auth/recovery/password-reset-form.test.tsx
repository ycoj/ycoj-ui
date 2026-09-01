import PasswordResetForm from './password-reset-form';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock('@/api/client/method', () => ({
  default: { Auth: { completePasswordReset: mocks.complete } },
}));

function renderForm(props: { initialError?: string } = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasswordResetForm code="reset/token" username="alice" {...props} />
    </NextIntlClientProvider>
  );
}

describe('PasswordResetForm', () => {
  beforeEach(() => vi.resetAllMocks());

  it('blocks mismatched passwords', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('New password'), 'secret');
    await user.type(screen.getByLabelText('Repeat password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(
      await screen.findByText('The passwords do not match.')
    ).toBeInTheDocument();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('submits the token and both password fields', async () => {
    mocks.complete.mockReturnValue({
      send: vi.fn().mockResolvedValue({ url: '/login' }),
    });
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('New password'), 'secret');
    await user.type(screen.getByLabelText('Repeat password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    await waitFor(() =>
      expect(mocks.complete).toHaveBeenCalledWith({
        code: 'reset/token',
        password: 'secret',
        verifyPassword: 'secret',
      })
    );
  });

  it('shows an invalid-token state without rendering password fields', () => {
    renderForm({
      initialError: 'This password reset link is invalid or has expired.',
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'invalid or has expired'
    );
    expect(screen.queryByLabelText('New password')).toBeNull();
  });
});
