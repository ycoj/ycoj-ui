import RealnameReviewFilter from '@/features/realname/manage/realname-review-filter';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/manage/realname',
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams('status=pending&page=3'),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('searches by username and resets the page', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RealnameReviewFilter value="pending" username="" />
    </NextIntlClientProvider>
  );

  const search = page.getByRole('searchbox', {
    name: 'Search applications by username',
  });
  await expect.element(search).toBeVisible();
  await userEvent.type(search, 'Alice');
  await userEvent.click(page.getByRole('button', { name: 'Search' }));

  expect(mocks.push).toHaveBeenCalledWith(
    '/manage/realname?status=pending&uname=Alice'
  );
});

test('applies the pending username filter to the search field', async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RealnameReviewFilter value="approved" username="bob" />
    </NextIntlClientProvider>
  );

  const search = page.getByRole('searchbox', {
    name: 'Search applications by username',
  });
  await expect.element(search).toHaveValue('bob');
});
