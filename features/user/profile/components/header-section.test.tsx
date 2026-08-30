import HeaderSection from './header-section';
import type { UserDetailResponse } from '@/api/server/method/user/detail';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

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
  checkinHistory: {
    timezone: 'UTC+08:00',
    from: '',
    to: '',
    total: 0,
    records: [],
  },
};

describe('profile editing entry', () => {
  it.each([true, false])(
    'shows the edit link only for self profiles (isSelfProfile=%s)',
    (isSelfProfile) => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <HeaderSection data={{ ...data, isSelfProfile }} />
        </NextIntlClientProvider>
      );
      const link = screen.queryByRole('link', { name: 'Edit profile' });
      if (isSelfProfile)
        expect(link).toHaveAttribute('href', '/home/settings/account');
      else expect(link).not.toBeInTheDocument();
    }
  );
});
