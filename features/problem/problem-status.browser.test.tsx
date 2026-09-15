import ProblemStatus from './problem-status';
import messages from '@/messages/en';
import { STATUS } from '@/shared/configs/status';
import type { ProblemStatus as ProblemStatusDoc } from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function makeStatusDoc(status?: number): ProblemStatusDoc {
  return {
    _id: 'r'.repeat(24),
    docId: 1,
    docType: 10,
    domainId: 'system',
    status,
    rid: 'r'.repeat(24),
  };
}

function renderStatus(status?: number, progress?: number) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemStatus status={makeStatusDoc(status)} progress={progress} />
    </NextIntlClientProvider>
  );
}

const STATUS_APPEARANCE: Array<[number, string, string]> = [
  [STATUS.STATUS_WAITING, 'Waiting', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_ACCEPTED, 'Accepted', 'rgb(22, 163, 74)'],
  [STATUS.STATUS_WRONG_ANSWER, 'Wrong Answer', 'rgb(239, 68, 68)'],
  [STATUS.STATUS_TIME_LIMIT_EXCEEDED, 'Time Exceeded', 'rgb(107, 33, 168)'],
  [STATUS.STATUS_MEMORY_LIMIT_EXCEEDED, 'Memory Exceeded', 'rgb(157, 23, 77)'],
  [STATUS.STATUS_OUTPUT_LIMIT_EXCEEDED, 'Output Exceeded', 'rgb(239, 68, 68)'],
  [STATUS.STATUS_RUNTIME_ERROR, 'Runtime Error', 'rgb(234, 88, 12)'],
  [STATUS.STATUS_COMPILE_ERROR, 'Compile Error', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_SYSTEM_ERROR, 'System Error', 'rgb(239, 68, 68)'],
  [STATUS.STATUS_CANCELED, 'Canceled', 'rgb(75, 85, 99)'],
  [STATUS.STATUS_ETC, 'Unknown Error', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_HACKED, 'Hacked', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_JUDGING, 'Judging', 'rgb(75, 85, 99)'],
  [STATUS.STATUS_COMPILING, 'Compiling', 'rgb(75, 85, 99)'],
  [STATUS.STATUS_FETCHED, 'Fetched', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_IGNORED, 'Ignored', 'rgb(75, 85, 99)'],
  [STATUS.STATUS_FORMAT_ERROR, 'Format Error', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_HACK_SUCCESSFUL, 'Hack Successful', 'rgb(107, 114, 128)'],
  [STATUS.STATUS_HACK_UNSUCCESSFUL, 'Hack Unsuccessful', 'rgb(107, 114, 128)'],
];

test.each(STATUS_APPEARANCE)(
  'renders status %i as a linked badge with its status color',
  async (statusCode, labelText, backgroundColor) => {
    await renderStatus(statusCode);

    const label = page.getByText(labelText, { exact: true });
    await expect.element(label).toBeVisible();
    const link = label.element().closest('a')!;
    expect(getComputedStyle(link).backgroundColor).toBe(backgroundColor);
    expect(link.getAttribute('href')).toBe(`/record/${'r'.repeat(24)}`);
  }
);

test('keeps the status icon visible when the label is hidden on narrow screens', async () => {
  await page.viewport(480, 720);
  await renderStatus(STATUS.STATUS_ACCEPTED);

  const label = page.getByText('Accepted', { exact: true });
  await expect.element(label).not.toBeVisible();

  const icon = label.element().closest('a')!.querySelector('svg')!;
  const bounds = icon.getBoundingClientRect();
  expect(bounds.width).toBe(12);
  expect(bounds.height).toBe(12);
  expect(getComputedStyle(icon).display).not.toBe('none');
});

test('spins the icon only while the judge is working', async () => {
  for (const statusCode of [
    STATUS.STATUS_JUDGING,
    STATUS.STATUS_COMPILING,
    STATUS.STATUS_FETCHED,
  ]) {
    const { unmount } = await renderStatus(statusCode);
    const icon = document.querySelector('svg')!;
    await expect
      .poll(() => getComputedStyle(icon).animationName)
      .toContain('spin');
    await unmount();
  }

  await renderStatus(STATUS.STATUS_ACCEPTED);
  expect(getComputedStyle(document.querySelector('svg')!).animationName).toBe(
    'none'
  );
});

test('fills the badge background up to the reported progress', async () => {
  await renderStatus(STATUS.STATUS_JUDGING, 40);

  const badge = document.querySelector<HTMLElement>('[data-slot="badge"]')!;
  const overlay = badge.querySelector<HTMLElement>('span[aria-hidden="true"]')!;
  expect(overlay).not.toBeNull();
  expect(getComputedStyle(overlay).backgroundColor).toBe('rgb(75, 85, 99)');
  await expect
    .poll(() => getComputedStyle(overlay).clipPath)
    .toMatch(/inset\(0(px)? 60% 0(px)? 0(px)?\)/);

  const badgeBounds = badge.getBoundingClientRect();
  const overlayBounds = overlay.getBoundingClientRect();
  // The overlay is inset by the one-pixel badge border on each side.
  expect(Math.abs(overlayBounds.width - badgeBounds.width)).toBeLessThanOrEqual(
    2
  );
  expect(
    Math.abs(overlayBounds.height - badgeBounds.height)
  ).toBeLessThanOrEqual(2);
});

test.each([
  [0, /inset\(0(px)? 100% 0(px)? 0(px)?\)/],
  [100, /inset\(0(px)? 0% 0(px)? 0(px)?\)/],
] as const)('clips the progress fill to %i%%', async (progress, clipPath) => {
  await renderStatus(STATUS.STATUS_JUDGING, progress);

  const overlay = document.querySelector<HTMLElement>(
    '[data-slot="badge"] span[aria-hidden="true"]'
  )!;
  await expect.poll(() => getComputedStyle(overlay).clipPath).toMatch(clipPath);
});

test('keeps the solid badge when progress is missing', async () => {
  await renderStatus(STATUS.STATUS_JUDGING);

  const badge = document.querySelector<HTMLElement>('[data-slot="badge"]')!;
  expect(badge.querySelector('span[aria-hidden="true"]')).toBeNull();
  expect(getComputedStyle(badge).backgroundColor).toBe('rgb(75, 85, 99)');
});

test('ignores progress for finished statuses', async () => {
  await renderStatus(STATUS.STATUS_ACCEPTED, 60);

  const badge = document.querySelector<HTMLElement>('[data-slot="badge"]')!;
  expect(badge.querySelector('span[aria-hidden="true"]')).toBeNull();
  expect(getComputedStyle(badge).backgroundColor).toBe('rgb(22, 163, 74)');
});

test('renders nothing for missing or unknown statuses', async () => {
  await renderStatus(undefined);
  await expect
    .poll(() => document.querySelectorAll('[data-slot="badge"]').length)
    .toBe(0);

  await renderStatus(999);
  await expect
    .poll(() => document.querySelectorAll('[data-slot="badge"]').length)
    .toBe(0);
});
