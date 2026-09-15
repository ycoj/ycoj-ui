import OmnibarProvider from './omnibar-provider';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('./omnibar', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Omnibar</div> : null,
}));

test('opens for Ctrl-K outside an editable context', async () => {
  await render(
    <OmnibarProvider>
      <button>Outside editor</button>
    </OmnibarProvider>
  );

  const button = page.getByRole('button', { name: 'Outside editor' });
  button.element().focus();
  await userEvent.keyboard('{Control>}k{/Control}');

  await expect.element(page.getByRole('dialog')).toBeVisible();
});

test.each([
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
] as const)('leaves Ctrl-K to the %s', async (_kind, editor) => {
  await render(<OmnibarProvider>{editor}</OmnibarProvider>);

  const target = page.getByLabelText('Editable target');
  let prevented: boolean | undefined;
  const listener = (event: KeyboardEvent) => {
    prevented = event.defaultPrevented;
  };
  document.addEventListener('keydown', listener);

  target.element().focus();
  await userEvent.keyboard('{Control>}k{/Control}');

  document.removeEventListener('keydown', listener);

  expect(prevented).toBe(false);
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});
