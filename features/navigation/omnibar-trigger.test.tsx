import OmnibarProvider from './omnibar-provider';
import OmnibarTrigger from './omnibar-trigger';
import en from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/components/ui/sidebar', async () => {
  const { forwardRef } = await import('react');

  return {
    SidebarMenuButton: forwardRef<
      HTMLButtonElement,
      ComponentProps<'button'> & { tooltip?: string }
    >(function SidebarMenuButton({ tooltip, ...props }, ref) {
      return <button ref={ref} title={tooltip} {...props} />;
    }),
  };
});

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: { searchOmnibarProblems: vi.fn() },
    User: { searchUsers: vi.fn() },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('OmnibarTrigger', () => {
  it('opens the omnibar from the sidebar search control', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <OmnibarProvider>
          <OmnibarTrigger />
        </OmnibarProvider>
      </NextIntlClientProvider>
    );

    await user.click(
      screen.getByRole('button', { name: /Search problems and users/ })
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
