import RealnameReviewFilter from '@/features/realname/manage/realname-review-filter';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/manage/realname',
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams('status=pending&page=3'),
}));

describe('RealnameReviewFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches by username and resets the page', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RealnameReviewFilter value="pending" username="" />
      </NextIntlClientProvider>
    );

    await user.type(
      screen.getByRole('searchbox', {
        name: 'Search applications by username',
      }),
      'Alice'
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(mocks.push).toHaveBeenCalledWith(
      '/manage/realname?status=pending&uname=Alice'
    );
  });
});
