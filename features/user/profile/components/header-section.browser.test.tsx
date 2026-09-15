import HeaderSection from './header-section';
import type { UserDetailResponse } from '@/api/server/method/user/detail';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const data: UserDetailResponse = {
  isSelfProfile: true,
  udoc: {
    _id: 2,
    uname: 'alice',
    mail: 'alice@example.com',
    priv: 4,
    regat: '',
    loginat: '',
  },
  sdoc: null,
  pdocs: [],
  tags: [],
  tdocs: [],
  awardRecords: [],
  accountExpireDate: null,
  checkinHistory: {
    timezone: 'UTC+08:00',
    from: '',
    to: '',
    total: 0,
    records: [],
  },
};

function renderSection(overrides: Partial<UserDetailResponse> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HeaderSection data={{ ...data, ...overrides }} />
    </NextIntlClientProvider>
  );
}

test.each([true, false])(
  'shows the edit link only for self profiles (isSelfProfile=%s)',
  async (isSelfProfile) => {
    await renderSection({ isSelfProfile });

    const link = page.getByRole('link', { name: 'Edit profile' });
    if (isSelfProfile) {
      await expect.element(link).toBeVisible();
      expect(link.element().getAttribute('href')).toBe(
        '/home/settings/account'
      );
    } else {
      await expect.element(link).not.toBeInTheDocument();
    }
  }
);

test('hides the expiration for viewers without access', async () => {
  await renderSection({ accountExpireDate: null });

  await expect
    .element(page.getByText(/Never expires|Expires:/))
    .not.toBeInTheDocument();
});

test('hides the expiration when the field is absent (older backend)', async () => {
  await renderSection({ accountExpireDate: undefined });

  await expect
    .element(page.getByText(/Never expires|Expires:/))
    .not.toBeInTheDocument();
});

test('shows the expiration date when set', async () => {
  await renderSection({ accountExpireDate: '2099-01-01' });

  await expect
    .element(page.getByText('Expires: 2099-01-01', { exact: true }))
    .toBeVisible();
});

test('shows never-expire when no expiration is set', async () => {
  await renderSection({ accountExpireDate: '' });

  await expect
    .element(page.getByText('Never expires', { exact: true }))
    .toBeVisible();
});
