import ProblemTitle from '@/features/problem/detail/problem-title';
import messages from '@/messages/en.json';
import type { Contest } from '@/shared/types/contest';
import type {
  ProblemConfig,
  PublicProjectionProblem,
} from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function makeProblem(config?: ProblemConfig): PublicProjectionProblem {
  return {
    _id: 'p'.repeat(24),
    domainId: 'system',
    docType: 10,
    docId: 1,
    pid: 'P1000',
    owner: 1,
    title: 'A + B',
    nSubmit: 3,
    nAccept: 1,
    tag: [],
    content: '',
    data: [],
    ...(config ? { config } : {}),
  } as PublicProjectionProblem;
}

function makeContest(): Contest {
  return {
    _id: 't'.repeat(24),
    domainId: 'system',
    docType: 30,
    docId: '1',
    owner: 1,
    beginAt: new Date('2026-01-01T00:00:00Z'),
    endAt: new Date('2026-01-02T00:00:00Z'),
    attend: 0,
    title: 'Sample Contest',
    content: '',
    rule: 'oi',
    pids: [],
    duration: 24,
  } as Contest;
}

function renderTitle(problem: PublicProjectionProblem, contest?: Contest) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemTitle problem={problem} contest={contest} />
    </NextIntlClientProvider>
  );
}

async function expectBadge(text: string) {
  const badge = page.getByText(text, { exact: true });
  await expect.element(badge).toBeVisible();
  const bounds = badge.element().getBoundingClientRect();
  expect(bounds.width).toBeGreaterThan(0);
  expect(bounds.height).toBeGreaterThan(0);
}

test('falls back to default time, memory and type when config is missing', async () => {
  await renderTitle(makeProblem());

  await expectBadge('1000ms');
  await expectBadge('256MiB');
  await expectBadge('Traditional');
});

test('falls back to the default type when config has no type', async () => {
  await renderTitle(
    makeProblem({
      count: 1,
      memoryMax: 512,
      memoryMin: 128,
      timeMax: 2000,
      timeMin: 1000,
      type: '',
    })
  );

  await expectBadge('Traditional');
});

test('renders the provided config values', async () => {
  await renderTitle(
    makeProblem({
      count: 1,
      memoryMax: 512,
      memoryMin: 128,
      timeMax: 2000,
      timeMin: 1000,
      type: 'interactive',
    })
  );

  await expectBadge('2000ms');
  await expectBadge('512MiB');
  await expectBadge('Interactive');
});

test('shows accepted and submission counts outside contest mode', async () => {
  await renderTitle(makeProblem());

  const accepted = page.getByRole('link', { name: '1 Accepted' });
  const submissions = page.getByRole('link', { name: '3 Submissions' });
  await expect.element(accepted).toBeVisible();
  await expect.element(submissions).toBeVisible();
  expect(accepted.element().getAttribute('href')).toBe(
    '/record?pid=1&status=1'
  );
  expect(submissions.element().getAttribute('href')).toBe('/record?pid=1');

  const acceptedBounds = accepted.element().getBoundingClientRect();
  const submissionsBounds = submissions.element().getBoundingClientRect();
  expect(acceptedBounds.right).toBeLessThanOrEqual(submissionsBounds.left);
  expect(acceptedBounds.top).toBeCloseTo(submissionsBounds.top, 0);
});

test('hides accepted and submission counts in contest mode', async () => {
  await renderTitle(makeProblem(), makeContest());

  await expect
    .element(page.getByText('Accepted', { exact: true }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByText('Submissions', { exact: true }))
    .not.toBeInTheDocument();
  await expectBadge('Sample Contest');
});

test('shows the serialized file I/O name for default problems with a subtype', async () => {
  await renderTitle(
    makeProblem({
      count: 1,
      memoryMax: 256,
      memoryMin: 256,
      timeMax: 1000,
      timeMin: 1000,
      type: 'default',
      subType: 'data',
    })
  );

  await expectBadge('File I/O: data');
});

test('does not treat an unsupported fileio type as file I/O', async () => {
  await renderTitle(
    makeProblem({
      count: 1,
      memoryMax: 256,
      memoryMin: 256,
      timeMax: 1000,
      timeMin: 1000,
      type: 'fileio',
      subType: 'data',
    })
  );

  await expect
    .element(page.getByText('File I/O: data', { exact: true }))
    .not.toBeInTheDocument();
});
