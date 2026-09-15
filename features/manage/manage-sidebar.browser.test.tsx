import ManageSidebar from '@/features/manage/manage-sidebar';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('next/navigation', () => ({
  usePathname: () => '/manage/user-expiration',
}));

function renderSidebar(priv: number) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ManageSidebar priv={priv} />
    </NextIntlClientProvider>
  );
}

function findLink(label: string) {
  return page.getByRole('link', { name: label, includeHidden: true });
}

test('shows every permitted link and highlights the current page', async () => {
  await renderSidebar(-1);

  const importUsers = findLink('Import users');
  const realname = findLink('Real-name review');
  const expiration = findLink('Account expiration');
  await expect.element(importUsers).toBeVisible();
  await expect.element(realname).toBeVisible();
  await expect.element(expiration).toBeVisible();

  expect(importUsers.element().getAttribute('aria-current')).toBeNull();
  expect(realname.element().getAttribute('aria-current')).toBeNull();
  expect(expiration.element().getAttribute('aria-current')).toBe('page');

  await realname.unhover();
  await expect
    .poll(() => getComputedStyle(expiration.element()).backgroundColor)
    .not.toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(realname.element()).backgroundColor).toBe(
    'rgba(0, 0, 0, 0)'
  );
  expect(getComputedStyle(realname.element()).color).not.toBe(
    getComputedStyle(expiration.element()).color
  );
});

test('stacks the navigation links without overlap', async () => {
  await renderSidebar(-1);

  const importUsers = findLink('Import users').element();
  const realname = findLink('Real-name review').element();
  const expiration = findLink('Account expiration').element();
  const nav = page.getByRole('navigation', { name: 'System management' });
  await expect.element(nav).toBeVisible();

  const first = importUsers.getBoundingClientRect();
  const second = realname.getBoundingClientRect();
  const third = expiration.getBoundingClientRect();
  const navBounds = nav.element().getBoundingClientRect();
  expect(first.height).toBeGreaterThan(0);
  expect(second.top).toBeGreaterThanOrEqual(first.bottom);
  expect(third.top).toBeGreaterThanOrEqual(second.bottom);
  expect(first.left).toBeGreaterThanOrEqual(navBounds.left);
  expect(third.right).toBeLessThanOrEqual(navBounds.right);
});

test('hides the real-name review link from expiry-only managers', async () => {
  await renderSidebar(5);

  await expect.element(findLink('Import users')).toBeVisible();
  await expect.element(findLink('Account expiration')).toBeVisible();
  await expect
    .poll(() => document.querySelectorAll('a[href="/manage/realname"]').length)
    .toBe(0);
});

test('renders an empty navigation without management privileges', async () => {
  await renderSidebar(4);

  const nav = page.getByRole('navigation', { name: 'System management' });
  await expect.element(nav).toBeInTheDocument();
  await expect.poll(() => document.querySelectorAll('nav a').length).toBe(0);
});
