import OmnibarProvider from './omnibar-provider';
import OmnibarTrigger from './omnibar-trigger';
import en from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

test('opens the omnibar from the sidebar search control', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={en}>
      <OmnibarProvider>
        <OmnibarTrigger />
      </OmnibarProvider>
    </NextIntlClientProvider>
  );

  await userEvent.click(
    page.getByRole('button', { name: /Search problems and users/ })
  );

  await expect.element(page.getByRole('dialog')).toBeVisible();
});
