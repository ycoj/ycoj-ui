import PasteDeleteButton from './paste-delete-button';
import messages from '@/messages/en.json';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Paste: {
      deletePaste: (id: string) => ({
        send: () => mocks.delete(id),
      }),
    },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

function renderDelete() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasteDeleteButton id="abc123" />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.delete.mockResolvedValue({});
});

describe('paste delete button', () => {
  it.each(['cancel', 'escape'])(
    'dismisses deletion with %s without sending a request',
    async (action) => {
      renderDelete();
      const trigger = screen.getByRole('button', { name: 'Delete' });
      await userEvent.click(trigger);
      const dialog = screen.getByRole('alertdialog', { name: 'Delete' });
      expect(dialog).toHaveAccessibleDescription(messages.paste.deleteConfirm);
      expect(mocks.delete).not.toHaveBeenCalled();
      expect(
        within(dialog).getByRole('button', { name: 'Cancel' })
      ).toHaveFocus();
      if (action === 'cancel') {
        await userEvent.click(
          within(dialog).getByRole('button', { name: 'Cancel' })
        );
      } else {
        await userEvent.keyboard('{Escape}');
      }
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(mocks.delete).not.toHaveBeenCalled();
      expect(trigger).toHaveFocus();
    }
  );

  it('deletes without depending on form content', async () => {
    renderDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      })
    );
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('abc123'));
    expect(mocks.push).toHaveBeenCalledWith('/paste');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('shows deletion permission errors without navigating', async () => {
    mocks.delete.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    renderDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the confirmation open and disables actions while deleting', async () => {
    let resolve!: (value: object) => void;
    mocks.delete.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    renderDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' })
    );
    expect(
      within(dialog).getByRole('button', { name: 'Deleting…' })
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' })
    ).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(dialog).toBeInTheDocument();
    expect(mocks.delete).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
    resolve({});
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(mocks.push).toHaveBeenCalledWith('/paste');
  });
});
