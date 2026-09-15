import CodeCopyButton from './code-copy-button';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const writeText = vi.hoisted(() => vi.fn());

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

function renderButton(text: string, variant?: 'corner' | 'inline') {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className="relative h-32 w-64">
        <CodeCopyButton text={text} variant={variant} />
      </div>
    </NextIntlClientProvider>
  );
}

test('copies the text and shows the copied label', async () => {
  await renderButton('int main() {}');

  await page.getByRole('button', { name: 'Copy' }).click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  expect(writeText).toHaveBeenCalledWith('int main() {}');

  const copied = page.getByRole('button', { name: 'Copied' });
  await expect.element(copied).toBeVisible();
  expect(copied.element().querySelector('svg.lucide-check')).not.toBeNull();
  await expect
    .element(page.getByRole('button', { name: 'Copied' }), { timeout: 3000 })
    .not.toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Copy' }))
    .toBeVisible();
});

test('keeps the copy label when the clipboard write is rejected', async () => {
  writeText.mockRejectedValue(new Error('denied'));
  await renderButton('int main() {}');

  await page.getByRole('button', { name: 'Copy' }).click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);

  expect(page.getByRole('button', { name: 'Copied' }).query()).toBeNull();
  await expect
    .element(page.getByRole('button', { name: 'Copy' }))
    .toBeVisible();
});

test('places the corner variant in the top-right corner of the block', async () => {
  await renderButton('printf');

  const button = page.getByRole('button', { name: 'Copy' });
  await expect.element(button).toBeVisible();
  const container = button.element().parentElement!;
  await expect
    .poll(() => {
      const buttonBounds = button.element().getBoundingClientRect();
      const containerBounds = container.getBoundingClientRect();
      return (
        Math.abs(containerBounds.right - buttonBounds.right) +
        Math.abs(buttonBounds.top - containerBounds.top)
      );
    })
    .toBeLessThanOrEqual(1);
});

test('insets the inline variant from the container corner', async () => {
  await renderButton('printf', 'inline');

  const button = page.getByRole('button', { name: 'Copy' });
  await expect.element(button).toBeVisible();
  const container = button.element().parentElement!;
  await expect
    .poll(() => {
      const buttonBounds = button.element().getBoundingClientRect();
      const containerBounds = container.getBoundingClientRect();
      return (
        Math.abs(containerBounds.right - buttonBounds.right - 8) +
        Math.abs(buttonBounds.top - containerBounds.top - 8)
      );
    })
    .toBeLessThanOrEqual(1);
});
