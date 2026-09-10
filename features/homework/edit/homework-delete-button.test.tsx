import HomeworkDeleteButton from './homework-delete-button';
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
    Homework: {
      deleteHomework: (tid: string) => ({
        send: () => mocks.delete(tid),
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
      <HomeworkDeleteButton tid="abc123" />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.delete.mockResolvedValue({});
});

describe('homework delete button', () => {
  it('dismisses deletion without sending a request', async () => {
    renderDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete' });
    expect(dialog).toHaveAccessibleDescription(
      messages.homeworkEdit.deleteConfirm
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it('deletes and returns to the homework list', async () => {
    renderDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      })
    );
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('abc123'));
    expect(mocks.push).toHaveBeenCalledWith('/homework');
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
    const dialog = screen.getByRole('alertdialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
