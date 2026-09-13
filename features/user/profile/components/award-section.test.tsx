import AwardSection from './award-section';
import type { UserDetailResponse } from '@/api/server/method/user/detail';
import messages from '@/messages/en';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

function makeData(
  overrides: Partial<UserDetailResponse> = {}
): UserDetailResponse {
  return {
    isSelfProfile: false,
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
    ...overrides,
  };
}

const certifiedRecord = {
  _id: 'record-1',
  oierId: 10,
  contestName: 'NOI 2026',
  contestType: 'NOI',
  year: 2026,
  award: 'Gold',
  score: null,
  rank: 1,
  school: 'Example School',
  province: 'Hunan',
  grade: 'Senior 2',
};

function renderSection(data: UserDetailResponse) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AwardSection data={data} />
    </NextIntlClientProvider>
  );
}

describe('AwardSection', () => {
  it('hides an empty award section on another user profile', () => {
    const { container } = renderSection(makeData());
    expect(container).toBeEmptyDOMElement();
  });

  it('offers award certification on an empty self profile', () => {
    renderSection(makeData({ isSelfProfile: true }));

    expect(screen.getByText('No certified awards yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Award certification' })
    ).toHaveAttribute('href', '/home/award');
  });

  it('renders certified award records', () => {
    renderSection(makeData({ awardRecords: [certifiedRecord] }));

    expect(screen.getByText('NOI 2026')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Example School')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument();
  });

  it('keeps the certification link on a self profile with records', () => {
    renderSection(
      makeData({ isSelfProfile: true, awardRecords: [certifiedRecord] })
    );

    expect(
      screen.getByRole('link', { name: 'Award certification' })
    ).toHaveAttribute('href', '/home/award');
  });

  it('hides the certification link on another user profile with records', () => {
    renderSection(makeData({ awardRecords: [certifiedRecord] }));

    expect(
      screen.queryByRole('link', { name: 'Award certification' })
    ).not.toBeInTheDocument();
  });
});
