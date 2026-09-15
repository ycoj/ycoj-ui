import ProblemSample, { ProblemSampleActionProvider } from './problem-sample';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const writeText = vi.hoisted(() => vi.fn());

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

function renderSample(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function sample() {
  return (
    <ProblemSample
      data-input={encodeURIComponent('1 2\n')}
      data-output={encodeURIComponent('3\n')}
    />
  );
}

test('renders copy controls without a sample action', async () => {
  await renderSample(sample());

  await expect
    .poll(() => page.getByRole('button', { name: 'Copy' }).elements().length)
    .toBe(2);
  await expect
    .element(page.getByRole('button', { name: 'Use sample' }))
    .not.toBeInTheDocument();
});

test('runs a consumer-provided sample action with decoded input', async () => {
  const onSelect = vi.fn();
  await renderSample(
    <ProblemSampleActionProvider action={{ label: 'Use sample', onSelect }}>
      {sample()}
    </ProblemSampleActionProvider>
  );

  const action = page.getByRole('button', { name: 'Use sample' });
  await expect.element(action).toBeVisible();
  await userEvent.click(action);
  expect(onSelect).toHaveBeenCalledWith('1 2\n');
});

test('copies the decoded sample text and stacks the panes on mobile', async () => {
  await page.viewport(480, 720);
  const { container } = await renderSample(sample());

  const panes = Array.from(
    container.querySelectorAll<HTMLElement>('.grid > div')
  );
  expect(panes).toHaveLength(2);
  const [inputPane, outputPane] = panes;
  const inputBounds = inputPane.getBoundingClientRect();
  const outputBounds = outputPane.getBoundingClientRect();
  expect(outputBounds.top).toBeGreaterThanOrEqual(inputBounds.bottom);
  expect(Math.abs(outputBounds.left - inputBounds.left)).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: 'Copy' }).first().click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  expect(writeText).toHaveBeenCalledWith('1 2\n');

  await page.viewport(1280, 720);
  const wideInput = inputPane.getBoundingClientRect();
  const wideOutput = outputPane.getBoundingClientRect();
  expect(wideOutput.left).toBeGreaterThanOrEqual(wideInput.right);
});
