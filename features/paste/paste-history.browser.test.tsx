import PasteHistory from './paste-history';
import { pasteDoc, pasteOptions } from './paste.test-utils';
import messages from '@/messages/en.json';
import type { PasteDoc } from '@/shared/types/paste';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('next/navigation', () => ({
  usePathname: () => '/paste',
  useSearchParams: () => new URLSearchParams('page=2'),
}));

function renderHistory(pdocs: PasteDoc[], totalPages = 1) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={messages}
      timeZone="Asia/Shanghai"
    >
      <PasteHistory
        pdocs={pdocs}
        page={2}
        ppcount={totalPages}
        languageOptions={pasteOptions.languageOptions}
      />
    </NextIntlClientProvider>
  );
}

test('shows an empty state', async () => {
  await renderHistory([]);

  await expect
    .element(page.getByText('No snippets shared yet', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByRole('navigation')).not.toBeInTheDocument();
});

test('uses ids for untitled pastes and backend total pages', async () => {
  const { container } = await renderHistory([{ ...pasteDoc, title: '' }], 3);

  const link = page.getByRole('link', { name: 'abc123' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/paste/abc123');
  await expect.element(page.getByText('Python', { exact: true })).toBeVisible();

  const time = container.querySelector('time');
  expect(time?.getAttribute('datetime')).toBe(pasteDoc.updatedAt);

  const lastPage = page.getByRole('link', { name: '3', exact: true });
  await expect.element(lastPage).toBeVisible();
  expect(lastPage.element().getAttribute('href')).toBe('/paste?page=3');
});

test('shows Markdown and custom language labels', async () => {
  await renderHistory([
    { ...pasteDoc, mode: 'markdown' },
    { ...pasteDoc, _id: 'custom', language: 'rust' },
  ]);

  await expect
    .element(page.getByText('Markdown', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('rust', { exact: true })).toBeVisible();
});
