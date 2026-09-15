import MarkdownCodeBlock from './markdown-code-block';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
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

function renderBlock() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div>
        <p>page copy</p>
        <MarkdownCodeBlock>
          <code>
            <span>int</span> <span>main</span>() {'{}'}
          </code>
        </MarkdownCodeBlock>
      </div>
    </NextIntlClientProvider>
  );
}

test('copies highlighted code as plain text', async () => {
  await renderBlock();

  await page.getByRole('button', { name: 'Copy' }).click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  expect(writeText).toHaveBeenCalledWith('int main() {}');
  await expect
    .element(page.getByRole('button', { name: 'Copied' }))
    .toBeVisible();
});

test('confines Ctrl+A to the code when the block is focused', async () => {
  const { container } = await renderBlock();

  const pre = container.querySelector('pre');
  expect(pre).not.toBeNull();
  pre!.focus();
  expect(document.activeElement).toBe(pre);
  await userEvent.keyboard('{Control>}a{/Control}');

  const selected = window.getSelection()?.toString() ?? '';
  expect(selected).toBe('int main() {}');
  expect(selected).not.toContain('page copy');
});

test('insets the copy control from the top-right of the block', async () => {
  const { container } = await renderBlock();

  const button = page.getByRole('button', { name: 'Copy' });
  const wrapper = container.querySelector<HTMLElement>('div.relative')!;
  await expect
    .poll(() => {
      const buttonBounds = button.element().getBoundingClientRect();
      const wrapperBounds = wrapper.getBoundingClientRect();
      return (
        Math.abs(wrapperBounds.right - buttonBounds.right - 8) +
        Math.abs(buttonBounds.top - wrapperBounds.top - 8)
      );
    })
    .toBeLessThanOrEqual(1);
});
