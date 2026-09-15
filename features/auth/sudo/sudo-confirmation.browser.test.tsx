import SudoConfirmation from './sudo-confirmation';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

function methodSelector() {
  return page.getByRole('group', { name: 'Verification method' });
}

function verifyButton() {
  return page.getByRole('button', { name: 'Verify identity' });
}

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

test('hides the method selector when only password authentication is available', async () => {
  await renderForm();

  await expect.element(methodSelector()).not.toBeInTheDocument();
  await expect
    .element(page.getByLabelText('Password'))
    .toHaveAttribute('type', 'password');
  await expect.element(verifyButton()).toBeEnabled();
});

test.each([
  { authn: false, tfa: true },
  { authn: true, tfa: false },
  { authn: true, tfa: true },
])('keeps available methods selectable for %j', async (capabilities) => {
  await renderForm(capabilities);

  const selector = methodSelector();
  await expect.element(selector).toBeVisible();
  await expect
    .poll(() => selector.getByRole('button').elements().length)
    .toBe(1 + Number(capabilities.authn) + Number(capabilities.tfa));

  const preferred = capabilities.authn ? 'Security key' : 'Authentication code';
  const preferredButton = selector.getByRole('button', { name: preferred });
  await expect.element(preferredButton).toBeVisible();
  expect(preferredButton.element().getAttribute('aria-pressed')).toBe('true');

  await userEvent.click(selector.getByRole('button', { name: 'Password' }));
  await expect
    .element(page.getByLabelText('Password'))
    .toHaveAttribute('type', 'password');
  await expect
    .poll(() =>
      selector
        .getByRole('button', { name: 'Password' })
        .element()
        .getAttribute('aria-pressed')
    )
    .toBe('true');
  expect(mocks.sudo).not.toHaveBeenCalled();
});

test('confirms with a password without treating replay metadata as an instruction', async () => {
  mocks.sudo.mockReturnValue(
    resolved({
      method: 'post',
      redirect: '/manage/user-expiration',
      args: { operation: 'adjust', uids: [999], days: 999 },
    })
  );
  await renderForm();

  await userEvent.type(page.getByLabelText('Password'), 'secret');
  await userEvent.click(verifyButton());

  await expect.poll(() => mocks.completed.mock.calls.length).toBe(1);
  expect(mocks.sudo).toHaveBeenCalledWith('password', 'secret');
});

test('defaults to TFA and preserves leading zeroes', async () => {
  await renderForm({ authn: false, tfa: true });

  const code = page.getByLabelText('Authentication code');
  await userEvent.type(code, '012345');
  await expect.element(code).toHaveValue('012345');
  await userEvent.click(verifyButton());

  await expect.poll(() => mocks.sudo.mock.calls.length).toBeGreaterThan(0);
  expect(mocks.sudo).toHaveBeenCalledWith('tfa', '012345');
});

test('rejects an invalid code without requesting verification', async () => {
  await renderForm({ authn: false, tfa: true });

  await userEvent.click(verifyButton());

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('six-digit');
  expect(mocks.sudo).not.toHaveBeenCalled();
});

test('defaults to the security key and submits only the verified challenge', async () => {
  await renderForm({ authn: true, tfa: true });

  await expect.element(page.getByLabelText('Password')).not.toBeInTheDocument();
  await userEvent.click(verifyButton());

  await expect.poll(() => mocks.completed.mock.calls.length).toBe(1);
  expect(mocks.start).toHaveBeenCalledWith({
    optionsJSON: { challenge: 'challenge-1' },
  });
  expect(mocks.verify).toHaveBeenCalledWith({ id: 'key-id' });
  expect(mocks.sudo).toHaveBeenCalledWith('authnChallenge', 'challenge-1');
});

test('handles unsupported browsers without starting WebAuthn', async () => {
  vi.stubGlobal('isSecureContext', false);
  await renderForm({ authn: true, tfa: false });

  await userEvent.click(verifyButton());

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('secure connection');
  expect(mocks.start).not.toHaveBeenCalled();
  expect(mocks.sudo).not.toHaveBeenCalled();
});

test('handles a canceled authenticator prompt', async () => {
  mocks.start.mockRejectedValue(new Error('Canceled by user'));
  await renderForm({ authn: true, tfa: false });

  await userEvent.click(verifyButton());

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Canceled by user');
  expect(mocks.sudo).not.toHaveBeenCalled();
});

test('does not continue when the challenge expires', async () => {
  mocks.verify.mockReturnValue(
    resolved({ error: { message: 'Challenge expired' } })
  );
  await renderForm({ authn: true, tfa: false });

  await userEvent.click(verifyButton());

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Challenge expired');
  expect(mocks.completed).not.toHaveBeenCalled();
  expect(mocks.sudo).not.toHaveBeenCalled();
});

test('rejects failed password verification', async () => {
  mocks.sudo.mockReturnValue(
    resolved({ error: { message: 'Wrong password' } })
  );
  await renderForm();

  await userEvent.type(page.getByLabelText('Password'), 'secret');
  await userEvent.click(verifyButton());

  await expect.element(page.getByRole('alert')).toBeVisible();
  expect(mocks.completed).not.toHaveBeenCalled();
});

test('cancels without submitting credentials', async () => {
  await renderForm();

  await userEvent.click(page.getByRole('button', { name: 'Cancel' }));

  expect(mocks.cancel).toHaveBeenCalledOnce();
  expect(mocks.sudo).not.toHaveBeenCalled();
});

test('ignores an in-flight verification after unmount', async () => {
  let resolve!: (value: unknown) => void;
  mocks.sudo.mockReturnValue({
    send: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const view = await renderForm();

  await userEvent.fill(page.getByLabelText('Password'), 'secret');
  await userEvent.click(verifyButton());
  await expect.poll(() => mocks.sudo.mock.calls.length).toBe(1);

  await view.unmount();
  resolve({ url: '/manage/user-expiration' });
  await new Promise((done) => setTimeout(done, 20));
  expect(mocks.completed).not.toHaveBeenCalled();
});
