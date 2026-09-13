import ConfirmActionDialog, {
  type ConfirmActionDialogProps,
} from './confirm-action-dialog';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Clear answers' }));
  return screen.getByRole('alertdialog', { name: 'Clear answers' });
}

describe('ConfirmActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens on the trigger and cancels without confirming', async () => {
    const { onConfirm } = renderDialog();
    const dialog = await openDialog();
    expect(dialog).toHaveAccessibleDescription(
      'This removes your saved answers.'
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('runs the action and closes on confirm', async () => {
    const { onConfirm } = renderDialog();
    const dialog = await openDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Clear answers' })
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the thrown message and stays open when the action fails', async () => {
    renderDialog({
      onConfirm: vi.fn(() => Promise.reject(new Error('idb gone'))),
    });
    const dialog = await openDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Clear answers' })
    );
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'idb gone'
    );
    expect(dialog).toBeInTheDocument();
  });

  it('falls back to the localized error when the action throws nothing useful', async () => {
    renderDialog({
      onConfirm: vi.fn(() => Promise.reject(new Error(''))),
    });
    const dialog = await openDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Clear answers' })
    );
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Clear failed'
    );
  });

  it('blocks dismissal while the action is pending', async () => {
    let resolve!: () => void;
    renderDialog({
      onConfirm: vi.fn(
        () =>
          new Promise<void>((done) => {
            resolve = done;
          })
      ),
    });
    const dialog = await openDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Clear answers' })
    );
    expect(
      within(dialog).getByRole('button', { name: 'Clearing' })
    ).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(dialog).toBeInTheDocument();
    resolve();
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
  });
});
