import { canManageExpiration, manageLanding } from './manage-access';
import ManageSidebar from './manage-sidebar';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/manage/user-expiration',
}));

describe('management access', () => {
  it.each([
    { priv: -1, path: '/manage/realname', allowed: true },
    { priv: 5, path: '/manage/user-expiration', allowed: true },
    { priv: 4, path: '/home', allowed: false },
  ])('routes privilege $priv correctly', ({ priv, path, allowed }) => {
    expect(canManageExpiration({ priv })).toBe(allowed);
    expect(manageLanding({ priv })).toBe(path);
  });
  it.each([-1, 5, 4])('shows only permitted links for privilege %s', (priv) => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ManageSidebar priv={priv} />
      </NextIntlClientProvider>
    );
    expect(!!screen.queryByRole('link', { name: 'Real-name review' })).toBe(
      priv === -1
    );
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toHaveClass('flex-col');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(!!screen.queryByRole('link', { name: 'Account expiration' })).toBe(
      canManageExpiration({ priv })
    );
    if (canManageExpiration({ priv }))
      expect(
        screen.getByRole('link', { name: 'Account expiration' })
      ).toHaveAttribute('aria-current', 'page');
  });
});
