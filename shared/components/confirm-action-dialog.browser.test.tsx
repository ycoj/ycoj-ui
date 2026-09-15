import ConfirmActionDialog, {
  type ConfirmActionDialogProps,
} from './confirm-action-dialog';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

function renderDialog(overrides: Partial<ConfirmActionDialogProps> = {}) {
  const props: ConfirmActionDialogProps = {
    title: 'Clear answers',
    description: 'This removes your saved answers.',
    confirmLabel: 'Clear answers',
    pendingLabel: 'Clearing',
    cancelLabel: 'Cancel',
    fallbackError: 'Clear failed',
    onConfirm: vi.fn(() => Promise.resolve()),
    trigger: (pending) => (
      <button type="button" disabled={pending}>
        Clear answers
      </button>
    ),
    ...overrides,
  };
  render(<ConfirmActionDialog {...props} />);
  return props;
}

function trigger() {
  return page.getByRole('button', { name: 'Clear answers', exact: true });
}

test('opens on the trigger and cancels without confirming', async () => {
  const { onConfirm } = renderDialog();
  const triggerButton = trigger();
  await userEvent.click(triggerButton);

  const dialog = page.getByRole('alertdialog', { name: 'Clear answers' });
  await expect.element(dialog).toBeVisible();
  const describedBy = dialog.element().getAttribute('aria-describedby');
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    'This removes your saved answers.'
  );

  const bounds = dialog.element().getBoundingClientRect();
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);

  await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await expect.element(dialog).not.toBeInTheDocument();
  expect(onConfirm).not.toHaveBeenCalled();
  await expect
    .poll(() => document.activeElement === triggerButton.element())
    .toBe(true);
});

test('runs the action and closes on confirm', async () => {
  const { onConfirm } = renderDialog();
  await userEvent.click(trigger());

  const dialog = page.getByRole('alertdialog', { name: 'Clear answers' });
  await userEvent.click(
    dialog.getByRole('button', { name: 'Clear answers', exact: true })
  );
  await expect.element(dialog).not.toBeInTheDocument();
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('shows the thrown message and stays open when the action fails', async () => {
  renderDialog({
    onConfirm: vi.fn(() => Promise.reject(new Error('idb gone'))),
  });
  await userEvent.click(trigger());

  const dialog = page.getByRole('alertdialog', { name: 'Clear answers' });
  await userEvent.click(
    dialog.getByRole('button', { name: 'Clear answers', exact: true })
  );
  const alert = dialog.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('idb gone');
  await expect.element(dialog).toBeVisible();
});

test('falls back to the localized error when the action throws nothing useful', async () => {
  renderDialog({
    onConfirm: vi.fn(() => Promise.reject(new Error(''))),
  });
  await userEvent.click(trigger());

  const dialog = page.getByRole('alertdialog', { name: 'Clear answers' });
  await userEvent.click(
    dialog.getByRole('button', { name: 'Clear answers', exact: true })
  );
  await expect
    .element(dialog.getByRole('alert'))
    .toHaveTextContent('Clear failed');
});

test('blocks dismissal while the action is pending', async () => {
  let finish!: () => void;
  renderDialog({
    onConfirm: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    ),
  });
  await userEvent.click(trigger());

  const dialog = page.getByRole('alertdialog', { name: 'Clear answers' });
  await userEvent.click(
    dialog.getByRole('button', { name: 'Clear answers', exact: true })
  );
  const pending = dialog.getByRole('button', { name: 'Clearing' });
  await expect.element(pending).toBeDisabled();
  expect(
    getComputedStyle(pending.element().querySelector('svg')!).animationName
  ).toContain('spin');

  await userEvent.keyboard('{Escape}');
  await expect.element(dialog).toBeVisible();

  finish();
  await expect.element(dialog).not.toBeInTheDocument();
});
