import AwardSection from './award-section';
import type { UserDetailResponse } from '@/api/server/method/user/detail';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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

test('hides an empty award section on another user profile', async () => {
  const { container } = await renderSection(makeData());
  expect(container).toBeEmptyDOMElement();
});

test('offers award certification on an empty self profile', async () => {
  await renderSection(makeData({ isSelfProfile: true }));

  await expect
    .element(page.getByText('No certified awards yet.', { exact: true }))
    .toBeVisible();
  const link = page.getByRole('link', { name: 'Award certification' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/home/award');
});

test('renders certified award records', async () => {
  await renderSection(makeData({ awardRecords: [certifiedRecord] }));

  await expect
    .element(page.getByText('NOI 2026', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('Gold', { exact: true })).toBeVisible();
  await expect
    .element(page.getByText('Example School', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('cell', { name: '-', exact: true }))
    .toBeVisible();
});

test('keeps the certification link on a self profile with records', async () => {
  await renderSection(
    makeData({ isSelfProfile: true, awardRecords: [certifiedRecord] })
  );

  const link = page.getByRole('link', { name: 'Award certification' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/home/award');
});

test('hides the certification link on another user profile with records', async () => {
  await renderSection(makeData({ awardRecords: [certifiedRecord] }));

  await expect
    .element(page.getByRole('link', { name: 'Award certification' }))
    .not.toBeInTheDocument();
});
