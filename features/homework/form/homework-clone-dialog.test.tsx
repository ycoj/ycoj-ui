import HomeworkCloneDialog from './homework-clone-dialog';
import type { HomeworkCloneValues } from '@/features/homework/form/homework-form-utils';
import messages from '@/messages/en.json';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prefilled: HomeworkCloneValues = {
  title: 'Week 1 homework',
  beginAtDate: '2026-09-01',
  beginAtTime: '08:00',
  penaltySinceDate: '2026-09-08',
  penaltySinceTime: '23:59',
};

function renderDialog(
  defaultValues: HomeworkCloneValues = prefilled,
  onConfirm = vi.fn().mockResolvedValue(undefined)
) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HomeworkCloneDialog
        defaultValues={defaultValues}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    </NextIntlClientProvider>
  );
  return { onConfirm, onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('homework clone dialog', () => {
  it('prefills the clone settings', () => {
    renderDialog();
    expect(
      screen.getByRole('dialog', { name: 'Clone homework' })
    ).toHaveAccessibleDescription(messages.homeworkEdit.cloneDescription);
    expect(screen.getByLabelText('Title')).toHaveValue('Week 1 homework');
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-09-01');
    expect(screen.getByLabelText('Start time')).toHaveValue('08:00');
    expect(screen.getByLabelText('Deadline date')).toHaveValue('2026-09-08');
    expect(screen.getByLabelText('Deadline time')).toHaveValue('23:59');
  });

  it('blocks a deadline before the start time', async () => {
    const { onConfirm } = renderDialog({
      ...prefilled,
      penaltySinceDate: '2026-09-01',
      penaltySinceTime: '07:00',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Clone' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.homeworkEdit.endAfterStart
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms with the edited settings', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog(undefined, onConfirm);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Week 2 homework' },
    });
    fireEvent.change(screen.getByLabelText('Deadline date'), {
      target: { value: '2026-09-15' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Clone' }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
      title: 'Week 2 homework',
      beginAtDate: '2026-09-01',
      beginAtTime: '08:00',
      penaltySinceDate: '2026-09-15',
      penaltySinceTime: '23:59',
    });
  });

  it('shows clone failures inside the dialog and stays open', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Permission denied'));
    renderDialog(undefined, onConfirm);
    await userEvent.click(screen.getByRole('button', { name: 'Clone' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(
      screen.getByRole('dialog', { name: 'Clone homework' })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Clone' })).toBeEnabled();
  });

  it('cancels without confirming', async () => {
    const { onConfirm, onOpenChange } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
