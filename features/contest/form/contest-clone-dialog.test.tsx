import ContestCloneDialog from './contest-clone-dialog';
import type { ContestCloneValues } from '@/features/contest/form/contest-form-utils';
import messages from '@/messages/en.json';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prefilled: ContestCloneValues = {
  title: 'Weekly contest',
  beginAtDate: '2026-09-01',
  beginAtTime: '10:00',
  duration: '3',
};

function renderDialog(
  defaultValues: ContestCloneValues = prefilled,
  onConfirm = vi.fn().mockResolvedValue(undefined)
) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestCloneDialog
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

describe('contest clone dialog', () => {
  it('prefills the clone settings and previews the end time', () => {
    renderDialog();
    expect(
      screen.getByRole('dialog', { name: 'Clone contest' })
    ).toHaveAccessibleDescription(messages.contestEdit.cloneDescription);
    expect(screen.getByLabelText('Title')).toHaveValue('Weekly contest');
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-09-01');
    expect(screen.getByLabelText('Start time')).toHaveValue('10:00');
    expect(screen.getByLabelText('Duration (hours)')).toHaveValue(3);
    expect(screen.getByLabelText('End time')).toHaveValue('2026-09-01 13:00');
  });

  it('updates the end time preview while editing', async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText('Duration (hours)'), {
      target: { value: '1.5' },
    });
    expect(screen.getByLabelText('End time')).toHaveValue('2026-09-01 11:30');
  });

  it('blocks confirmation while the settings are invalid', async () => {
    const { onConfirm } = renderDialog({ ...prefilled, title: '   ' });
    await userEvent.click(screen.getByRole('button', { name: 'Clone' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.contestEdit.titleRequired
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms with the edited settings', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog(undefined, onConfirm);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Night contest' },
    });
    fireEvent.change(screen.getByLabelText('Start time'), {
      target: { value: '20:30' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Clone' }));
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
      title: 'Night contest',
      beginAtDate: '2026-09-01',
      beginAtTime: '20:30',
      duration: '3',
    });
  });

  it('shows clone failures inside the dialog and stays open', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Permission denied'));
    renderDialog(undefined, onConfirm);
    await userEvent.click(screen.getByRole('button', { name: 'Clone' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(screen.getByRole('dialog', { name: 'Clone contest' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Clone' })).toBeEnabled();
  });

  it('cancels without confirming', async () => {
    const { onConfirm, onOpenChange } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
