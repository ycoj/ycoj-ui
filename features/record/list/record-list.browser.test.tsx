import RecordList from './record-list';
import type { RecordListResponse } from '@/api/server/method/record/list';
import messages from '@/messages/en.json';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordListItem } from '@/shared/types/record';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const record: RecordListItem = {
  _id: 'a'.repeat(24),
  domainId: 'system',
  pid: 1000,
  uid: 2,
  lang: 'cc.cc17',
  score: 100,
  memory: 0,
  time: 0,
  rejudged: false,
  judger: 0,
  judgeAt: '',
  status: 1,
};

function makeData(problem?: ProblemDoc): RecordListResponse {
  return {
    page: 1,
    rdocs: [record],
    tdoc: null,
    pdict: problem ? { [problem.docId]: problem } : {},
    udict: {},
    all: false,
    allDomain: false,
    notification: [],
  };
}

function renderList(problem?: ProblemDoc) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RecordList data={makeData(problem)} languages={{}} />
    </NextIntlClientProvider>
  );
}

test.each([
  [5, 'rgb(13, 135, 135)'],
  [undefined, 'rgb(140, 140, 140)'],
] as const)(
  'renders the problem id in its difficulty color (difficulty %s)',
  async (difficulty, color) => {
    await renderList({
      docId: 1000,
      pid: 'P1000',
      title: 'Problem A',
      difficulty,
    } as ProblemDoc);

    const pid = page.getByText('P1000.', { exact: true });
    await expect.element(pid).toBeVisible();
    await expect.poll(() => getComputedStyle(pid.element()).color).toBe(color);
    expect(pid.element().closest('a')?.getAttribute('href')).toBe(
      '/problem/P1000'
    );
  }
);

test('colors the accepted score and links it to the record', async () => {
  await renderList({
    docId: 1000,
    pid: 'P1000',
    title: 'Problem A',
    difficulty: 5,
  } as ProblemDoc);

  const score = page.getByText('100', { exact: true });
  await expect.element(score).toBeVisible();
  await expect
    .poll(() => getComputedStyle(score.element()).color)
    .toBe('rgb(22, 163, 74)');
  expect(score.element().closest('a')?.getAttribute('href')).toBe(
    `/record/${'a'.repeat(24)}`
  );
});

test('hides the secondary columns on narrow screens and shows them on desktop', async () => {
  await page.viewport(480, 720);
  await renderList({
    docId: 1000,
    pid: 'P1000',
    title: 'Problem A',
    difficulty: 5,
  } as ProblemDoc);

  await expect.element(page.getByText('P1000.', { exact: true })).toBeVisible();
  await expect
    .element(page.getByText('Time', { exact: true }))
    .not.toBeVisible();
  await expect
    .element(page.getByText('Memory', { exact: true }))
    .not.toBeVisible();

  await page.viewport(1280, 720);
  await expect.element(page.getByText('Time', { exact: true })).toBeVisible();
  await expect.element(page.getByText('Memory', { exact: true })).toBeVisible();
});
