import ContestEditForm from './contest-edit-form';
import {
  buildCreateContestPayload,
  getContestCreateDefaults,
  type ContestFormValues,
} from '@/features/contest/form/contest-form-utils';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  edit: vi.fn(),
  onSubmit: null as null | ((values: ContestFormValues) => Promise<string>),
  onClone: null as null | ((values: ContestFormValues) => Promise<string>),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      createContest: (payload: unknown) => ({
        send: () => mocks.create(payload),
      }),
      editContest: (tid: string, payload: unknown) => ({
        send: () => mocks.edit(tid, payload),
      }),
    },
  },
}));

vi.mock('@/features/contest/form/contest-form', () => ({
  default: ({
    onSubmit,
    onClone,
    extraActions,
    cancelHref,
  }: {
    onSubmit: (values: ContestFormValues) => Promise<string>;
    onClone?: (values: ContestFormValues) => Promise<string>;
    extraActions?: ReactNode;
    cancelHref: string;
  }) => {
    mocks.onSubmit = onSubmit;
    mocks.onClone = onClone ?? null;
    return (
      <div>
        <a href={cancelHref}>Cancel</a>
        {extraActions}
      </div>
    );
  },
}));

vi.mock('@/shared/components/confirm-delete-button', () => ({
  default: ({ id }: { id: string }) => (
    <button type="button">Delete {id}</button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onSubmit = null;
  mocks.onClone = null;
  mocks.create.mockResolvedValue({ tid: 'def456' });
  mocks.edit.mockResolvedValue({ tid: 'abc123' });
});

function renderEdit() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestEditForm
        tid="abc123"
        defaultValues={getContestCreateDefaults()}
        canAutoHide={false}
        domainId="system"
        canClone
      />
    </NextIntlClientProvider>
  );
}

describe('contest edit form', () => {
  it('renders the delete action for the current contest', () => {
    renderEdit();
    expect(
      screen.getByRole('button', { name: 'Delete abc123' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/contest/abc123'
    );
  });

  it('clones with the create payload and returns the new contest path', async () => {
    const values = getContestCreateDefaults();
    renderEdit();
    await expect(mocks.onClone!(values)).resolves.toBe('/contest/def456');
    expect(mocks.create).toHaveBeenCalledWith(
      buildCreateContestPayload(values)
    );
    expect(mocks.edit).not.toHaveBeenCalled();
  });

  it('throws the clone failure message when the response has no tid', async () => {
    mocks.create.mockResolvedValue({});
    renderEdit();
    await expect(mocks.onClone!(getContestCreateDefaults())).rejects.toThrow(
      messages.contestEdit.cloneFailed
    );
  });

  it('throws the backend error message when the clone response is an error', async () => {
    mocks.create.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    renderEdit();
    await expect(mocks.onClone!(getContestCreateDefaults())).rejects.toThrow(
      'Permission denied'
    );
  });

  it('saves with the edit payload for the current contest', async () => {
    const values = getContestCreateDefaults();
    renderEdit();
    await expect(mocks.onSubmit!(values)).resolves.toBe('/contest/abc123');
    expect(mocks.edit).toHaveBeenCalledWith(
      'abc123',
      buildCreateContestPayload(values)
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('throws the backend error message when saving fails', async () => {
    mocks.edit.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    renderEdit();
    await expect(mocks.onSubmit!(getContestCreateDefaults())).rejects.toThrow(
      'Permission denied'
    );
  });
});
