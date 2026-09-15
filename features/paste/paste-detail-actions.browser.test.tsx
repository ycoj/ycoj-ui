import PasteDetailActions from './paste-detail-actions';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const writeText = vi.hoisted(() => vi.fn());

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

function renderActions(canManage: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasteDetailActions id="abc123" canManage={canManage} />
    </NextIntlClientProvider>
  );
}

test.each([true, false])('honors backend canManage=%s', async (canManage) => {
  await renderActions(canManage);

  if (canManage) {
    const edit = page.getByRole('link', { name: 'Edit snippet' });
    await expect.element(edit).toBeVisible();
    expect(edit.element().getAttribute('href')).toBe('/paste/abc123/edit');
  } else {
    await expect
      .element(page.getByRole('link', { name: 'Edit snippet' }))
      .not.toBeInTheDocument();
  }

  const raw = page.getByRole('link', { name: 'Raw text' });
  await expect.element(raw).toBeVisible();
  expect(raw.element().getAttribute('href')).toBe('/paste/abc123/raw');
  expect(raw.element().getAttribute('target')).toBe('_blank');
  expect(raw.element().getAttribute('rel')).toBe('noopener noreferrer');
});

test('copies an absolute detail URL on the current origin', async () => {
  await renderActions(false);

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  expect(writeText).toHaveBeenCalledWith(
    `${window.location.origin}/paste/abc123`
  );
  await expect
    .element(page.getByRole('button', { name: 'Link copied' }))
    .toBeVisible();
});
