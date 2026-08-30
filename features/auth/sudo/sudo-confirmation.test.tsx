import SudoConfirmation from './sudo-confirmation';
import messages from '@/messages/en.json';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sudo: vi.fn(),
  options: vi.fn(),
  verify: vi.fn(),
  start: vi.fn(),
  completed: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Auth: {
      confirmSudo: mocks.sudo,
      getWebauthnOptions: mocks.options,
      verifyWebauthn: mocks.verify,
    },
  },
}));
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: mocks.start,
}));

const resolved = (value: unknown) => ({
  send: vi.fn().mockResolvedValue(value),
});
function renderForm(capabilities = { authn: false, tfa: false }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SudoConfirmation
        capabilities={capabilities}
        onVerified={mocks.completed}
        onCancel={mocks.cancel}
      />
    </NextIntlClientProvider>
  );
}

describe('SudoConfirmation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('isSecureContext', true);
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {},
    });
    mocks.sudo.mockReturnValue(
      resolved({ url: '/manage/user-expiration?q=alice' })
    );
    mocks.options.mockReturnValue(
      resolved({ authOptions: { challenge: 'challenge-1' } })
    );
    mocks.start.mockResolvedValue({ id: 'key-id' });
    mocks.verify.mockReturnValue(resolved({ url: '/user/sudo' }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hides the method selector when only password authentication is available', () => {
    renderForm();
    expect(
      screen.queryByRole('group', { name: 'Verification method' })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
    expect(
      screen.getByRole('button', { name: 'Verify identity' })
    ).toBeEnabled();
  });

  it.each([
    { authn: false, tfa: true },
    { authn: true, tfa: false },
    { authn: true, tfa: true },
  ])('keeps available methods selectable for %j', async (capabilities) => {
    renderForm(capabilities);
    const selector = within(
      screen.getByRole('group', { name: 'Verification method' })
    );
    expect(selector.getAllByRole('button')).toHaveLength(
      1 + Number(capabilities.authn) + Number(capabilities.tfa)
    );
    const preferred = capabilities.authn
      ? 'Security key'
      : 'Authentication code';
    expect(selector.getByRole('button', { name: preferred })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(selector.getByRole('button', { name: 'Password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
    expect(selector.getByRole('button', { name: 'Password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(mocks.sudo).not.toHaveBeenCalled();
  });

  it('confirms with a password without treating replay metadata as an instruction', async () => {
    mocks.sudo.mockReturnValue(
      resolved({
        method: 'post',
        redirect: '/manage/user-expiration',
        args: { operation: 'adjust', uids: [999], days: 999 },
      })
    );
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Verify identity' }));
    await waitFor(() => expect(mocks.completed).toHaveBeenCalledOnce());
    expect(mocks.sudo).toHaveBeenCalledWith('password', 'secret');
  });
  it('defaults to TFA and preserves leading zeroes', async () => {
    renderForm({ authn: false, tfa: true });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Authentication code'), '012345');
    await user.click(screen.getByRole('button', { name: 'Verify identity' }));
    await waitFor(() =>
      expect(mocks.sudo).toHaveBeenCalledWith('tfa', '012345')
    );
  });
  it('rejects an invalid code without requesting verification', async () => {
    renderForm({ authn: false, tfa: true });
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify identity' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('six-digit');
    expect(mocks.sudo).not.toHaveBeenCalled();
  });
  it('defaults to the security key and submits only the verified challenge', async () => {
    renderForm({ authn: true, tfa: true });
    expect(screen.queryByLabelText('Password')).toBeNull();
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify identity' })
    );
    await waitFor(() => expect(mocks.completed).toHaveBeenCalledOnce());
    expect(mocks.start).toHaveBeenCalledWith({
      optionsJSON: { challenge: 'challenge-1' },
    });
    expect(mocks.verify).toHaveBeenCalledWith({ id: 'key-id' });
    expect(mocks.sudo).toHaveBeenCalledWith('authnChallenge', 'challenge-1');
  });
  it('handles unsupported browsers without starting WebAuthn', async () => {
    vi.stubGlobal('isSecureContext', false);
    renderForm({ authn: true, tfa: false });
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify identity' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'secure connection'
    );
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.sudo).not.toHaveBeenCalled();
  });
  it('handles a canceled authenticator prompt', async () => {
    mocks.start.mockRejectedValue(new Error('Canceled by user'));
    renderForm({ authn: true, tfa: false });
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify identity' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Canceled by user'
    );
    expect(mocks.sudo).not.toHaveBeenCalled();
  });
  it('does not continue when the challenge expires', async () => {
    mocks.verify.mockReturnValue(
      resolved({ error: { message: 'Challenge expired' } })
    );
    renderForm({ authn: true, tfa: false });
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify identity' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Challenge expired'
    );
    expect(mocks.completed).not.toHaveBeenCalled();
    expect(mocks.sudo).not.toHaveBeenCalled();
  });
  it.each([{ error: { message: 'Wrong password' } }])(
    'rejects failed verification %j',
    async (response) => {
      mocks.sudo.mockReturnValue(resolved(response));
      renderForm();
      await userEvent.type(screen.getByLabelText('Password'), 'secret');
      await userEvent.click(
        screen.getByRole('button', { name: 'Verify identity' })
      );
      await screen.findByRole('alert');
      expect(mocks.completed).not.toHaveBeenCalled();
    }
  );
  it('cancels without submitting credentials', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.cancel).toHaveBeenCalledOnce();
    expect(mocks.sudo).not.toHaveBeenCalled();
  });
  it('ignores an in-flight verification after unmount', async () => {
    let resolve!: (value: unknown) => void;
    mocks.sudo.mockReturnValue({
      send: () =>
        new Promise((done) => {
          resolve = done;
        }),
    });
    const view = renderForm();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify identity' })
    );
    await waitFor(() => expect(mocks.sudo).toHaveBeenCalledOnce());
    view.unmount();
    resolve({ url: '/manage/user-expiration' });
    await Promise.resolve();
    expect(mocks.completed).not.toHaveBeenCalled();
  });
});
