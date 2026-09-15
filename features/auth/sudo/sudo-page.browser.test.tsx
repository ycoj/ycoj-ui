import SudoPage from './sudo-page';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  resume: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock('./resume-sudo', () => ({ resumeSudo: mocks.resume }));
vi.mock('./sudo-confirmation', () => ({
  default: ({
    onVerified,
  }: {
    onVerified: (response: { url: string }) => void;
  }) => (
    <button
      onClick={() => {
        onVerified({ url: '/manage/setting' });
        onVerified({ url: '/manage/setting' });
      }}
    >
      Verify
    </button>
  ),
}));

function show(available: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SudoPage
        available={available}
        capabilities={{ authn: false, tfa: false }}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => vi.resetAllMocks());

test('does not offer verification without a pending server request', async () => {
  await show(false);

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('no pending verification');
  await expect
    .element(page.getByRole('button', { name: 'Verify' }))
    .not.toBeInTheDocument();
});

test('returns to the original page and refreshes server data after verification', async () => {
  mocks.resume.mockResolvedValue('/manage/setting');
  await show(true);

  await userEvent.click(page.getByRole('button', { name: 'Verify' }));

  await expect.poll(() => mocks.replace.mock.calls.length).toBe(1);
  expect(mocks.replace).toHaveBeenCalledWith('/manage/setting');
  expect(mocks.refresh).toHaveBeenCalledOnce();
  expect(mocks.resume).toHaveBeenCalledOnce();
});

test('resumes only once and prevents resubmission after an uncertain result', async () => {
  mocks.resume.mockRejectedValue(new Error('Network error'));
  await show(true);

  await userEvent.click(page.getByRole('button', { name: 'Verify' }));

  const alert = page.getByRole('alert');
  await expect
    .poll(() => alert.query()?.textContent ?? '')
    .toContain('Check its current status');
  expect(mocks.resume).toHaveBeenCalledOnce();
  await expect
    .element(page.getByRole('button', { name: 'Verify' }))
    .not.toBeInTheDocument();

  const backHome = page.getByRole('link', { name: 'Back to home' });
  await expect.element(backHome).toBeVisible();
  expect(backHome.element().getAttribute('href')).toBe('/home');
});
