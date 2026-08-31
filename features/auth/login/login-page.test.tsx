import { LoginPage } from './login-page';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client/method', () => ({
  default: { Auth: { login: vi.fn() } },
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/shared/components/site-footer', () => ({ default: () => null }));
vi.mock('@/shared/components/ui/checkbox', () => ({ Checkbox: () => null }));

describe('LoginPage', () => {
  it('loads the above-the-fold logo eagerly for both themes', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LoginPage />
      </NextIntlClientProvider>
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image).toHaveAttribute('loading', 'eager');
    }
  });
});
