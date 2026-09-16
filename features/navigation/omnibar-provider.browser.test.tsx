import OmnibarProvider from './omnibar-provider';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./omnibar', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Omnibar</div> : null,
}));

describe('OmnibarProvider shortcuts', () => {
  it('opens for Ctrl-K outside an editable context', () => {
    render(
      <OmnibarProvider>
        <button>Outside editor</button>
      </OmnibarProvider>
    );

    fireEvent.keyDown(screen.getByRole('button'), {
      key: 'k',
      ctrlKey: true,
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each([
    ['textarea', <textarea aria-label="Editable target" key="textarea" />],
    [
      'contenteditable',
      <div
        aria-label="Editable target"
        contentEditable
        key="contenteditable"
        role="textbox"
      />,
    ],
    [
      'Monaco',
      <div className="monaco-editor" key="monaco">
        <textarea aria-label="Editable target" />
      </div>,
    ],
  ])('leaves Ctrl-K to the %s', (_, editor) => {
    render(<OmnibarProvider>{editor}</OmnibarProvider>);

    const target = screen.getByLabelText('Editable target');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
