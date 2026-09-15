import ProblemDifficulty from './problem-difficulty';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

function renderDifficulty(difficulty?: number) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemDifficulty difficulty={difficulty} />
    </NextIntlClientProvider>
  );
}

const DIFFICULTY_APPEARANCE = [
  [1, 'Beginner', 'rgb(254, 76, 97)'],
  [2, 'Basic-', 'rgb(243, 156, 17)'],
  [3, 'Basic', 'rgb(255, 193, 22)'],
  [4, 'Basic+/Advanced-', 'rgb(82, 196, 26)'],
  [5, 'Advanced', 'rgb(19, 194, 194)'],
  [6, 'Advanced+/Provincial-', 'rgb(52, 152, 219)'],
  [7, 'Provincial/NOI-', 'rgb(157, 61, 207)'],
  [8, 'NOI/NOI+/CTS', 'rgb(14, 29, 105)'],
] as const;

test.each(DIFFICULTY_APPEARANCE)(
  'renders difficulty %i with its labeled color',
  async (difficulty, labelText, backgroundColor) => {
    await renderDifficulty(difficulty);

    const label = page.getByText(labelText, { exact: true });
    await expect.element(label).toBeVisible();
    await expect
      .poll(() => getComputedStyle(label.element()).color)
      .toBe('rgb(255, 255, 255)');

    const badge = label.element().parentElement!;
    await expect
      .poll(() => getComputedStyle(badge).backgroundColor)
      .toBe(backgroundColor);

    const textBounds = label.element().getBoundingClientRect();
    const badgeBounds = badge.getBoundingClientRect();
    expect(textBounds.width).toBeGreaterThan(0);
    expect(textBounds.left).toBeGreaterThan(badgeBounds.left);
    expect(textBounds.right).toBeLessThan(badgeBounds.right);
    expect(textBounds.top).toBeGreaterThanOrEqual(badgeBounds.top);
    expect(textBounds.bottom).toBeLessThanOrEqual(badgeBounds.bottom);
    expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth);
  }
);

test.each([undefined, -1, 99] as const)(
  'falls back to the unrated badge for %s',
  async (difficulty) => {
    await renderDifficulty(difficulty);

    const label = page.getByText('Unrated', { exact: true });
    await expect.element(label).toBeVisible();
    const badge = label.element().parentElement!;
    await expect
      .poll(() => getComputedStyle(badge).backgroundColor)
      .toBe('rgb(160, 160, 160)');
  }
);

test('keeps the difficulty badge legible in the dark theme', async () => {
  document.documentElement.classList.add('dark');
  await renderDifficulty(5);

  const label = page.getByText('Advanced', { exact: true });
  await expect.element(label).toBeVisible();
  await expect
    .poll(() => getComputedStyle(label.element()).color)
    .toBe('rgb(255, 255, 255)');
  const badge = label.element().parentElement!;
  await expect
    .poll(() => getComputedStyle(badge).backgroundColor)
    .toBe('rgb(19, 194, 194)');
});
