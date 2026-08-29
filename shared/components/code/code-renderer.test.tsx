import CodeRenderer from './code-renderer';
import { createEvent, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/code-highlighter', () => ({
  highlightCodeToHtml: (code: string) => code,
}));

describe('CodeRenderer', () => {
  it('confines Ctrl+A to the code when the block is focused', () => {
    const { container } = render(
      <div>
        <p>page copy</p>
        <CodeRenderer code="int main() {}" language="cpp" />
      </div>
    );

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
