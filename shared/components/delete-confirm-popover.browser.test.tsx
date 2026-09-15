import DeleteConfirmPopover from './delete-confirm-popover';
import type { Errorable } from '@/shared/types/error';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

function renderPopover(
  onDelete: () => Promise<Errorable<Record<string, never>>>,
  successHref?: string
) {
  return render(
    <div style={{ paddingLeft: 400 }}>
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
    </div>
  );
}

function deleteTrigger() {
  return page.getByRole('button', { name: 'Delete solution' });
}

function popoverTitle() {
  return page.getByText('Delete this solution?', { exact: true });
}

test('requires confirmation before deleting', async () => {
  vi.clearAllMocks();
  const onDelete = vi.fn().mockResolvedValue({});
  await renderPopover(onDelete, '/contest/contest');

  const trigger = deleteTrigger();
  await userEvent.click(trigger);
  await expect.element(popoverTitle()).toBeVisible();
  expect(onDelete).not.toHaveBeenCalled();

  const popover = popoverTitle()
    .element()
    .closest<HTMLElement>('[data-slot="popover-content"]')!;
  await expect
    .poll(() => {
      const popoverBounds = popover.getBoundingClientRect();
      const triggerBounds = trigger.element().getBoundingClientRect();
      return popoverBounds.top - triggerBounds.bottom;
    })
    .toBeGreaterThanOrEqual(-2);
  await expect
    .poll(() => {
      const popoverBounds = popover.getBoundingClientRect();
      const triggerBounds = trigger.element().getBoundingClientRect();
      return Math.abs(popoverBounds.right - triggerBounds.right);
    })
    .toBeLessThanOrEqual(8);
  const popoverBounds = popover.getBoundingClientRect();
  expect(popoverBounds.left).toBeGreaterThanOrEqual(0);
  expect(popoverBounds.right).toBeLessThanOrEqual(window.innerWidth);

  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));
  await expect.poll(() => onDelete.mock.calls.length).toBe(1);
  await expect.element(popoverTitle()).not.toBeInTheDocument();
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/contest/contest');
  expect(mocks.refresh).not.toHaveBeenCalled();
});

test('keeps the page on backend failure and shows the message', async () => {
  vi.clearAllMocks();
  const onDelete = vi.fn().mockResolvedValue({
    error: { name: 'PermissionError', message: 'Permission denied' },
  });
  await renderPopover(onDelete, '/contest/contest');

  await userEvent.click(deleteTrigger());
  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  await expect.element(popoverTitle()).toBeVisible();
  expect(mocks.push).not.toHaveBeenCalled();
});

test('clears a deletion error after closing and reopening', async () => {
  vi.clearAllMocks();
  const onDelete = vi.fn().mockResolvedValue({
    error: { name: 'PermissionError', message: 'Permission denied' },
  });
  await renderPopover(onDelete, '/contest/contest');

  await userEvent.click(deleteTrigger());
  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));
  await expect.element(page.getByRole('alert')).toBeVisible();

  await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
  await expect.element(popoverTitle()).not.toBeInTheDocument();
  await userEvent.click(deleteTrigger());
  await expect.element(popoverTitle()).toBeVisible();
  await expect
    .poll(() => document.querySelectorAll('[role="alert"]').length)
    .toBe(0);
});

test('refreshes in place without a success href', async () => {
  vi.clearAllMocks();
  const onDelete = vi.fn().mockResolvedValue({});
  await renderPopover(onDelete);

  await userEvent.click(deleteTrigger());
  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));

  await expect.poll(() => mocks.refresh.mock.calls.length).toBe(1);
  expect(mocks.push).not.toHaveBeenCalled();
});

test('shows the network failure message', async () => {
  vi.clearAllMocks();
  const onDelete = vi.fn().mockRejectedValue(new Error('Offline'));
  await renderPopover(onDelete, '/contest/contest');

  await userEvent.click(deleteTrigger());
  await userEvent.click(page.getByRole('button', { name: 'Confirm' }));

  await expect.element(page.getByRole('alert')).toHaveTextContent('Offline');
  expect(mocks.push).not.toHaveBeenCalled();
});
