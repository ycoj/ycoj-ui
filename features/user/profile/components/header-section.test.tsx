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
  accountExpireDate: null,
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

describe('account expiration', () => {
  const renderSection = (accountExpireDate: string | null) =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <HeaderSection data={{ ...data, accountExpireDate }} />
      </NextIntlClientProvider>
    );

  it('hides the expiration for viewers without access', () => {
    renderSection(null);
    expect(
      screen.queryByText(/Never expires|Expires:/)
    ).not.toBeInTheDocument();
  });

  it('shows the expiration date when set', () => {
    renderSection('2099-01-01');
    expect(screen.getByText('Expires: 2099-01-01')).toBeInTheDocument();
  });

  it('shows never-expire when no expiration is set', () => {
    renderSection('');
    expect(screen.getByText('Never expires')).toBeInTheDocument();
  });
});
