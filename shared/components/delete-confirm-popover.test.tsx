import DeleteConfirmPopover from './delete-confirm-popover';
import messages from '@/messages/en.json';
import type { Errorable } from '@/shared/types/error';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

function mount(node: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

function renderPopover(
  onDelete: () => Promise<Errorable<Record<string, never>>>,
  successHref?: string
) {
  return mount(
    <DeleteConfirmPopover
      onDelete={onDelete}
      successHref={successHref}
      deleteLabel="Delete solution"
      confirmDeleteLabel="Delete this solution?"
      cancelLabel="Cancel"
      confirmLabel="Confirm"
      deletingLabel="Deleting…"
      deleteFailedLabel="Could not delete the solution."
    />
  );
}

beforeEach(() => vi.clearAllMocks());

describe('delete confirm popover', () => {
  it('requires confirmation before deleting', async () => {
    const onDelete = vi.fn().mockResolvedValue({});
    renderPopover(onDelete, '/contest/contest');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it('keeps the page on backend failure', async () => {
    const onDelete = vi.fn().mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    renderPopover(onDelete, '/contest/contest');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('navigates to the success href without an extra refresh', async () => {
    const onDelete = vi.fn().mockResolvedValue({});
    renderPopover(onDelete, '/contest/contest');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/contest/contest')
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('only refreshes without a success href', async () => {
    const onDelete = vi.fn().mockResolvedValue({});
    renderPopover(onDelete);
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('shows a fallback message on network failure', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('Offline'));
    renderPopover(onDelete, '/contest/contest');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
