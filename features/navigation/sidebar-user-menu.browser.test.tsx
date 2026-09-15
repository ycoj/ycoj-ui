import SidebarUserMenu from './sidebar-user-menu';
import en from '@/messages/en';
import zh from '@/messages/zh';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  resolvedTheme: 'light',
  setTheme: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: mocks.resolvedTheme,
    setTheme: mocks.setTheme,
  }),
}));

vi.mock('@/shared/components/ui/sidebar', async () => {
  const { forwardRef } = await import('react');

  return {
    SidebarMenuButton: forwardRef<
      HTMLButtonElement,
      ComponentProps<'button'> & { size?: string }
    >(function SidebarMenuButton({ size, ...props }, ref) {
      return <button ref={ref} data-size={size} {...props} />;
    }),
  };
});

function renderMenu(locale: 'en' | 'zh' = 'en', canUsePaste = false) {
  const messages = locale === 'en' ? en : zh;

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SidebarUserMenu
        user={{ _id: 2, uname: 'alice' }}
        roleKey="user"
        avatarSrc="/avatar.png"
        canUsePaste={canUsePaste}
      />
    </NextIntlClientProvider>
  );
}

async function openMenu() {
  await userEvent.click(page.getByRole('button', { name: 'alice' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolvedTheme = 'light';
});

test.each([
  ['en', 'Share Snippets'],
  ['zh', '分享代码片段'],
] as const)('links to pastebin in %s', async (locale, label) => {
  await renderMenu(locale, true);
  await openMenu();

  const item = page.getByRole('menuitem', { name: label });
  await expect.element(item).toBeVisible();
  expect(item.element().getAttribute('href')).toBe('/paste');
});

test('hides pastebin when the profile privilege is missing', async () => {
  await renderMenu('en', false);
  await openMenu();

  await expect
    .element(page.getByRole('menuitem', { name: 'Share Snippets' }))
    .not.toBeInTheDocument();
});

test('links to the new account settings page', async () => {
  await renderMenu();
  await openMenu();

  const item = page.getByRole('menuitem', { name: 'Account settings' });
  await expect.element(item).toBeVisible();
  expect(item.element().getAttribute('href')).toBe('/home/settings/account');
});

test('renders the dark mode toggle below the language menu item', async () => {
  await renderMenu();
  await openMenu();

  const languageItem = page
    .getByText('Language', { exact: true })
    .element()
    .closest<HTMLElement>('[role="menuitem"]');
  const themeToggle = page.getByRole('menuitemcheckbox', { name: 'Dark mode' });
  await expect.element(themeToggle).toBeVisible();

  expect(languageItem).not.toBeNull();
  expect(
    languageItem?.compareDocumentPosition(themeToggle.element()) ?? 0
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(themeToggle.element().getAttribute('aria-checked')).toBe('false');
});

test('selects dark mode from a light theme', async () => {
  await renderMenu();
  await openMenu();

  await userEvent.click(
    page.getByRole('menuitemcheckbox', { name: 'Dark mode' })
  );

  expect(mocks.setTheme).toHaveBeenCalledWith('dark');
});

test('selects light mode from a dark theme', async () => {
  mocks.resolvedTheme = 'dark';
  await renderMenu();
  await openMenu();

  const themeToggle = page.getByRole('menuitemcheckbox', { name: 'Dark mode' });
  await expect.element(themeToggle).toBeVisible();
  expect(themeToggle.element().getAttribute('aria-checked')).toBe('true');

  await userEvent.click(themeToggle);

  expect(mocks.setTheme).toHaveBeenCalledWith('light');
});

test('renders the localized Chinese label', async () => {
  await renderMenu('zh');
  await openMenu();

  await expect
    .element(page.getByRole('menuitemcheckbox', { name: '深色模式' }))
    .toBeVisible();
});
