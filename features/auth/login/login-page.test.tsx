import { LoginPage } from './login-page';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  factors: vi.fn(),
  login: vi.fn(),
  verifyLoginSecurityKey: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Auth: {
      getLoginFactors: mocks.factors,
      login: mocks.login,
    },
  },
}));
vi.mock('./verify-login-security-key', () => ({
  verifyLoginSecurityKey: mocks.verifyLoginSecurityKey,
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('redirect=%2Fhome'),
}));
vi.mock('@/shared/components/site-footer', () => ({ default: () => null }));
vi.mock('@/shared/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      {...props}
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
    />
  ),
}));

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LoginPage />
    </NextIntlClientProvider>
  );
}

function mockMethod(response: unknown) {
  return { send: vi.fn().mockResolvedValue(response) };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.login.mockReturnValue(mockMethod({ url: '/home' }));
  });

  it('raises fetch priority for the logo without loading both themes eagerly', () => {
    renderPage();
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('fetchpriority', 'high');
    }
  });

  it('logs in directly when the account has no second factor', async () => {
    mocks.factors.mockReturnValue(mockMethod({ authn: false, tfa: false }));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(mocks.login).toHaveBeenCalledOnce());
    expect(mocks.factors).toHaveBeenCalledWith('alice');
    expect(mocks.login.mock.calls[0][0]).toMatchObject({
      uname: 'alice',
      password: 'secret',
      redirect: '/home',
    });
  });

  it('collects and submits a TOTP code', async () => {
    mocks.factors.mockReturnValue(mockMethod({ authn: false, tfa: true }));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(
      await screen.findByLabelText('Authentication code')
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Authentication code'), '012345');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() => expect(mocks.login).toHaveBeenCalledOnce());
    expect(mocks.login.mock.calls[0][0]).toMatchObject({
      uname: 'alice',
      password: 'secret',
      tfa: '012345',
      redirect: '/home',
    });
  });

  it('supports choosing WebAuthn when both factors are enabled', async () => {
    mocks.factors.mockReturnValue(mockMethod({ authn: true, tfa: true }));
    mocks.verifyLoginSecurityKey.mockResolvedValue('challenge-1');
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {},
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.click(screen.getByRole('button', { name: 'Security key' }));
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() => expect(mocks.login).toHaveBeenCalledOnce());
    expect(mocks.verifyLoginSecurityKey).toHaveBeenCalledWith(
      'alice',
      'Security key verification failed. Please try again.'
    );
    expect(mocks.login.mock.calls[0][0]).toMatchObject({
      authnChallenge: 'challenge-1',
      redirect: '/home',
    });
  });

  it('keeps the challenge open when WebAuthn is unavailable', async () => {
    mocks.factors.mockReturnValue(mockMethod({ authn: true, tfa: false }));
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Security keys require a supported browser'
    );
    expect(mocks.login).not.toHaveBeenCalled();
  });
});
