import SudoPage from './sudo-page';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('global sudo page', () => {
  beforeEach(() => vi.resetAllMocks());
  const show = (available: boolean) =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SudoPage
          available={available}
          capabilities={{ authn: false, tfa: false }}
        />
      </NextIntlClientProvider>
    );
  it('does not offer verification without a pending server request', () => {
    show(false);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'no pending verification'
    );
    expect(screen.queryByRole('button', { name: 'Verify' })).toBeNull();
  });
  it('returns to the original page and refreshes server data after verification', async () => {
    mocks.resume.mockResolvedValue('/manage/setting');
    show(true);
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/manage/setting')
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.resume).toHaveBeenCalledOnce();
  });
  it('resumes only once and prevents resubmission after an uncertain result', async () => {
    mocks.resume.mockRejectedValue(new Error('Network error'));
    show(true);
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Check its current status'
      )
    );
    expect(mocks.resume).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Verify' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
      'href',
      '/home'
    );
  });
});
