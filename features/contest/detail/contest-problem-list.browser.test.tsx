import ContestProblemList from './contest-problem-list';
import type { ContestProblemsData } from '@/api/server/method/contests/problems';
import messages from '@/messages/en.json';
import type { Contest } from '@/shared/types/contest';
import type { ProblemDoc } from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function makeData(attend?: number): ContestProblemsData {
  const contest = {
    _id: 't'.repeat(24),
    domainId: 'system',
    docId: 't'.repeat(24),
    docType: 30,
    owner: 1,
    beginAt: new Date('2026-01-01T00:00:00Z'),
    endAt: new Date('2026-01-02T00:00:00Z'),
    attend: 1,
    title: 'Contest',
    content: '',
    rule: 'acm',
    pids: [1000],
    duration: 24,
  } satisfies Contest;
  const problem = {
    _id: 'p'.repeat(24),
    domainId: 'system',
    docType: 10,
    docId: 1000,
    pid: 'A1000',
    owner: 1,
    title: 'A + B',
  } as ProblemDoc;

  return {
    pdict: { 1000: problem },
    psdict: {},
    udict: {},
    rdict: {},
    tdoc: contest,
    tcdocs: [],
    ...(attend === undefined ? {} : { tsdoc: { attend } }),
  };
}

function renderList(data: ContestProblemsData) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestProblemList tid="contest-id" data={data} />
    </NextIntlClientProvider>
  );
}

test('opens an attended contest problem in contest mode', async () => {
  await renderList(makeData(1));

  const link = page.getByRole('link', { name: 'A + B' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe(
    '/problem/A1000?tid=contest-id'
  );
  expect(link.element().getBoundingClientRect().height).toBeGreaterThan(0);
});

test('opens an unattended contest problem in normal mode', async () => {
  await renderList(makeData());

  const link = page.getByRole('link', { name: 'A + B' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/problem/A1000');
});
