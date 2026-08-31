import SidebarUserMenu from './sidebar-user-menu';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function renderMenu(locale: 'en' | 'zh' = 'en', canUsePaste = true) {
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
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'alice' }));
  return user;
}

describe('SidebarUserMenu theme toggle', () => {
  it.each([
    ['en', 'Share Snippets'],
    ['zh', '分享代码片段'],
  ] as const)('links to pastebin in %s', async (locale, label) => {
    renderMenu(locale);
    await openMenu();
    expect(screen.getByRole('menuitem', { name: label })).toHaveAttribute(
      'href',
      '/paste'
    );
  });

  it('hides pastebin when the profile privilege is missing', async () => {
    renderMenu('en', false);
    await openMenu();
    expect(
      screen.queryByRole('menuitem', { name: 'Share Snippets' })
    ).not.toBeInTheDocument();
  });
  it('links to the new account settings page', async () => {
    renderMenu();
    await openMenu();
    expect(
      screen.getByRole('menuitem', { name: 'Account settings' })
    ).toHaveAttribute('href', '/home/settings/account');
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolvedTheme = 'light';
  });

  it('renders the dark mode toggle below the language menu item', async () => {
    renderMenu();
    await openMenu();

    const languageItem = screen
      .getByText('Language')
      .closest('[role="menuitem"]');
    const themeToggle = screen.getByRole('menuitemcheckbox', {
      name: 'Dark mode',
    });

    expect(languageItem).not.toBeNull();
    expect(languageItem?.compareDocumentPosition(themeToggle) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(themeToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('selects dark mode from a light theme', async () => {
    renderMenu();
    const user = await openMenu();

    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Dark mode' })
    );

    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
  });

  it('selects light mode from a dark theme', async () => {
    mocks.resolvedTheme = 'dark';
    renderMenu();
    const user = await openMenu();

    const themeToggle = screen.getByRole('menuitemcheckbox', {
      name: 'Dark mode',
    });
    expect(themeToggle).toHaveAttribute('aria-checked', 'true');

    await user.click(themeToggle);

    expect(mocks.setTheme).toHaveBeenCalledWith('light');
  });

  it('renders the localized Chinese label', async () => {
    renderMenu('zh');
    await openMenu();

    expect(
      screen.getByRole('menuitemcheckbox', { name: '深色模式' })
    ).toBeInTheDocument();
  });
});
