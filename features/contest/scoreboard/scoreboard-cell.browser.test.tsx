import ScoreboardCell from '@/features/contest/scoreboard/scoreboard-cell';
import messages from '@/messages/en';
import type { ScoreboardNode } from '@/shared/types/contest';
import type { ProblemDict, ProblemDoc } from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function withMessages(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

function boundsOf(element: Element) {
  return element.getBoundingClientRect();
}

test('renders score levels with distinct readable colors and weight', async () => {
  await render(
    withMessages(
      <div>
        <ScoreboardCell node={{ type: 'record', value: 100 }} />
        <ScoreboardCell node={{ type: 'record', value: 99 }} />
        <ScoreboardCell node={{ type: 'record', value: 60 }} />
        <ScoreboardCell node={{ type: 'record', value: 59 }} />
        <ScoreboardCell node={{ type: 'record', value: 0 }} />
      </div>
    )
  );

  for (const [score, color] of [
    ['100', 'oklch(0.627 0.194 149.214)'],
    ['99', 'oklch(0.705 0.213 47.604)'],
    ['60', 'oklch(0.705 0.213 47.604)'],
    ['59', 'oklch(0.637 0.237 25.331)'],
    ['0', 'oklch(0.637 0.237 25.331)'],
  ] as const) {
    const value = page.getByText(score, { exact: true });
    await expect.element(value).toBeVisible();
    await expect
      .poll(() => getComputedStyle(value.element()).color)
      .toBe(color);
    expect(getComputedStyle(value.element()).fontWeight).toBe('600');
  }
});

test('renders problem header links with the contest context', async () => {
  const node: ScoreboardNode = { type: 'problem', value: 'A', raw: 1000 };
  await render(
    withMessages(<ScoreboardCell node={node} isHeader tid="contest123" />)
  );

  const link = page.getByRole('link', { name: 'A' });
  await expect.element(link).toBeVisible();
  await expect
    .element(link)
    .toHaveAttribute('href', '/problem/1000?tid=contest123');
  expect(boundsOf(link.element()).height).toBeGreaterThan(0);
});

test('resolves the header problem pid from the problem dictionary', async () => {
  const node: ScoreboardNode = { type: 'problem', value: 'B', raw: 1001 };
  const pdict: ProblemDict = {
    1001: {
      _id: 'p123',
      docId: 1001,
      pid: 'P1001',
      title: 'Problem B',
    } as unknown as ProblemDoc,
  };

  await render(
    withMessages(
      <ScoreboardCell node={node} isHeader pdict={pdict} tid="contest456" />
    )
  );

  const link = page.getByRole('link', { name: 'B' });
  await expect.element(link).toBeVisible();
  await expect
    .element(link)
    .toHaveAttribute('href', '/problem/P1001?tid=contest456');
});

test('renders problem headers without a contest context as plain problem links', async () => {
  const node: ScoreboardNode = { type: 'problem', value: 'C', raw: 1002 };
  await render(withMessages(<ScoreboardCell node={node} isHeader />));

  const link = page.getByRole('link', { name: 'C' });
  await expect.element(link).toBeVisible();
  await expect.element(link).toHaveAttribute('href', '/problem/1002');
});

test('renders non-header problem values as plain text', async () => {
  const node: ScoreboardNode = { type: 'problem', value: 'A', raw: 1000 };
  await render(
    withMessages(
      <ScoreboardCell node={node} isHeader={false} tid="contest123" />
    )
  );

  const text = page.getByText('A', { exact: true });
  await expect.element(text).toBeVisible();
  await expect.poll(() => document.querySelectorAll('a').length).toBe(0);
});

test('renders corrected records as linked scores separated on one line', async () => {
  const node: ScoreboardNode = {
    type: 'records',
    value: '',
    raw: [
      { value: 40, score: 40, raw: 'contest-record' },
      { value: 100, score: 100, raw: 'correction-record' },
    ],
  };

  await render(withMessages(<ScoreboardCell node={node} />));

  const contestRecord = page.getByRole('link', { name: '40' });
  const correctionRecord = page.getByRole('link', { name: '100' });
  await expect.element(contestRecord).toBeVisible();
  await expect.element(correctionRecord).toBeVisible();
  await expect
    .element(contestRecord)
    .toHaveAttribute('href', '/record/contest-record');
  await expect
    .element(correctionRecord)
    .toHaveAttribute('href', '/record/correction-record');

  const separator = contestRecord
    .element()
    .parentElement!.parentElement!.querySelector<HTMLElement>('span.mx-1')!;
  expect(separator.textContent).toBe('/');
  const first = boundsOf(contestRecord.element());
  const middle = boundsOf(separator);
  const last = boundsOf(correctionRecord.element());
  expect(middle.left).toBeGreaterThanOrEqual(first.right);
  expect(middle.right).toBeLessThanOrEqual(last.left);
  expect(middle.top).toBeLessThan(last.bottom);
  expect(middle.bottom).toBeGreaterThan(last.top);
  expect(
    getComputedStyle(contestRecord.element().firstElementChild!).color
  ).toBe('oklch(0.637 0.237 25.331)');
  expect(
    getComputedStyle(correctionRecord.element().firstElementChild!).color
  ).toBe('oklch(0.627 0.194 149.214)');
});

test('renders a colored first-solve balloon beside its linked record', async () => {
  await render(
    withMessages(
      <ScoreboardCell
        balloonColor="#2563eb"
        node={{
          type: 'record',
          value: '+1',
          raw: 'first-record',
          score: 100,
          first: true,
        }}
      />
    )
  );

  const record = page.getByRole('link', { name: '+1' });
  await expect.element(record).toBeVisible();
  await expect.element(record).toHaveAttribute('href', '/record/first-record');

  const balloonLink = page.getByRole('link', { name: 'First solve' });
  await expect.element(balloonLink).toBeVisible();
  const balloon = balloonLink.element().querySelector('svg')!;
  await expect
    .poll(() => getComputedStyle(balloon).color)
    .toBe('rgb(37, 99, 235)');

  const recordBounds = boundsOf(record.element());
  const balloonBounds = boundsOf(balloon);
  expect(balloonBounds.width).toBeGreaterThan(0);
  expect(balloonBounds.left).toBeGreaterThanOrEqual(recordBounds.right);
  expect(balloonBounds.top).toBeLessThan(recordBounds.bottom);
  expect(balloonBounds.bottom).toBeGreaterThan(recordBounds.top);
});

test('omits the first-solve balloon for regular records', async () => {
  await render(
    withMessages(
      <ScoreboardCell
        node={{
          type: 'record',
          value: '+1',
          raw: 'regular-record',
          score: 100,
        }}
      />
    )
  );

  const record = page.getByRole('link', { name: '+1' });
  await expect.element(record).toBeVisible();
  await expect
    .poll(() => document.querySelectorAll('[aria-label="First solve"]').length)
    .toBe(0);
});

test('renders each participant balloon in its problem color beside the name', async () => {
  await render(
    withMessages(
      <ScoreboardCell
        node={{ type: 'user', value: 'alice', raw: 1 }}
        ownedBalloonColors={['#dc2626', '#2563eb']}
        udict={{
          1: { _id: 1, uname: 'alice', mail: 'alice@example.com', avatar: '' },
        }}
      />
    )
  );

  const name = page.getByText('alice', { exact: true });
  await expect.element(name).toBeVisible();
  const nameBounds = boundsOf(name.element());

  const balloons = page.getByRole('img', { name: 'First solve' });
  await expect.element(balloons.nth(0)).toBeVisible();
  await expect.element(balloons.nth(1)).toBeVisible();
  for (const [index, color] of [
    [0, 'rgb(220, 38, 38)'],
    [1, 'rgb(37, 99, 235)'],
  ] as const) {
    const balloon = balloons.nth(index).element().querySelector('svg')!;
    await expect.poll(() => getComputedStyle(balloon).color).toBe(color);
    const balloonBounds = boundsOf(balloon);
    expect(balloonBounds.left).toBeGreaterThanOrEqual(nameBounds.right);
    expect(balloonBounds.top).toBeLessThan(nameBounds.bottom);
    expect(balloonBounds.bottom).toBeGreaterThan(nameBounds.top);
  }
});
