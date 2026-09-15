import { LoginPage } from './login-page';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('@/api/client/method', () => ({
  default: { Auth: { login: vi.fn() } },
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LoginPage />
    </NextIntlClientProvider>
  );
}

test('raises fetch priority for the logo without loading both themes eagerly', async () => {
  await renderPage();

  const images = page.getByRole('img', { includeHidden: true });
  await expect.poll(() => images.elements().length).toBe(2);
  for (const image of images.all()) {
    await expect.element(image).toHaveAttribute('loading', 'lazy');
    await expect.element(image).toHaveAttribute('fetchpriority', 'high');
  }
});

test('does not show the language switch', async () => {
  await renderPage();

  await expect
    .element(page.getByLabelText(messages.common.language))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: /sign in|log in/i }))
    .toBeVisible();
});
