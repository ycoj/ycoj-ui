import MarkdownCodeBlock from './markdown-code-block';
import messages from '@/messages/en.json';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

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

describe('MarkdownCodeBlock', () => {
  it('copies highlighted code as plain text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderBlock();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('int main() {}');
  });

  it('confines Ctrl+A to the code when the block is focused', () => {
    const { container } = renderBlock();

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    pre!.focus();
    expect(pre).toHaveFocus();

    const event = createEvent.keyDown(pre!, { key: 'a', ctrlKey: true });
    fireEvent(pre!, event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.getSelection()?.toString()).toBe('int main() {}');
  });
});
