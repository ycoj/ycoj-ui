import ProblemList from './problem-list';
import type { ProblemListResponse } from '@/api/server/method/problems/list';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function makeProblem(
  overrides: Partial<ProblemListResponse['pdocs'][number]> = {}
) {
  return {
    _id: 'p'.repeat(24),
    domainId: 'system',
    docType: 10 as const,
    docId: 1000,
    pid: 'P1000',
    owner: 1,
    title: 'A + B',
    difficulty: 5,
    nSubmit: 10,
    nAccept: 5,
    tag: ['math'],
    hidden: false,
    ...overrides,
  } as ProblemListResponse['pdocs'][number];
}

function makeData(pdocs: ProblemListResponse['pdocs']): ProblemListResponse {
  return {
    page: 1,
    pcount: pdocs.length,
    ppcount: 1,
    pcountRelation: 'eq',
    pdocs,
    psdict: {},
    qs: '',
  };
}

function renderList(data: ProblemListResponse, showTags = false) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemList data={data} showTags={showTags} searchParams={{}} />
    </NextIntlClientProvider>
  );
}

test('renders the problem id, title, difficulty and acceptance rate', async () => {
  await renderList(makeData([makeProblem()]));

  const id = page.getByText('P1000', { exact: true });
  await expect.element(id).toBeVisible();
  expect(id.element().closest('td')?.getAttribute('data-llm-text')).toBe(
    'P1000'
  );

  const title = page.getByRole('link', { name: 'A + B' });
  await expect.element(title).toBeVisible();
  expect(title.element().getAttribute('href')).toBe('/problem/P1000');

  const difficulty = page.getByText('Advanced', { exact: true });
  await expect.element(difficulty).toBeVisible();
  expect(
    getComputedStyle(difficulty.element().parentElement!).backgroundColor
  ).toBe('rgb(19, 194, 194)');

  const progress = page.getByRole('progressbar');
  await expect.element(progress).toBeVisible();
  expect(progress.element().getAttribute('data-llm-text')).toBe('50%');
  const indicator = progress
    .element()
    .querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
  await expect
    .poll(() => {
      const track = progress.element().getBoundingClientRect();
      const shift = Math.abs(
        new DOMMatrix(getComputedStyle(indicator).transform).m41
      );
      return Math.abs(shift - track.width / 2);
    })
    .toBeLessThanOrEqual(1);
});

test('shows tag badges for the problem', async () => {
  await renderList(makeData([makeProblem()]), true);

  const tag = page.getByText('math', { exact: true });
  await expect.element(tag).toBeVisible();
  const bounds = tag.element().getBoundingClientRect();
  expect(bounds.width).toBeGreaterThan(0);
  expect(bounds.height).toBeGreaterThan(0);
});

test('uses the unrated difficulty badge when no difficulty is set', async () => {
  await renderList(makeData([makeProblem({ difficulty: undefined })]));

  const difficulty = page.getByText('Unrated', { exact: true });
  await expect.element(difficulty).toBeVisible();
  expect(
    getComputedStyle(difficulty.element().parentElement!).backgroundColor
  ).toBe('rgb(160, 160, 160)');
});

test('hides the acceptance rate column on narrow screens', async () => {
  await page.viewport(480, 720);
  await renderList(makeData([makeProblem()]));

  await expect.element(page.getByText('P1000', { exact: true })).toBeVisible();
  await expect
    .element(page.getByText('Acceptance rate', { exact: true }))
    .not.toBeVisible();
  await expect
    .element(page.getByText('Difficulty', { exact: true }))
    .toBeVisible();

  await page.viewport(1280, 720);
  await expect
    .element(page.getByText('Acceptance rate', { exact: true }))
    .toBeVisible();
});
