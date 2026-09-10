import HomeworkEditForm from './homework-edit-form';
import {
  buildCreateHomeworkPayload,
  getHomeworkCreateDefaults,
  type HomeworkFormValues,
} from '@/features/homework/form/homework-form-utils';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  edit: vi.fn(),
  onSubmit: null as null | ((values: HomeworkFormValues) => Promise<string>),
  onClone: null as null | ((values: HomeworkFormValues) => Promise<string>),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Homework: {
      createHomework: (payload: unknown) => ({
        send: () => mocks.create(payload),
      }),
      editHomework: (tid: string, payload: unknown) => ({
        send: () => mocks.edit(tid, payload),
      }),
    },
  },
}));

vi.mock('@/features/homework/form/homework-form', () => ({
  default: ({
    onSubmit,
    onClone,
    extraActions,
    cancelHref,
  }: {
    onSubmit: (values: HomeworkFormValues) => Promise<string>;
    onClone?: (values: HomeworkFormValues) => Promise<string>;
    extraActions?: ReactNode;
    cancelHref: string;
  }) => {
    mocks.onSubmit = onSubmit;
    mocks.onClone = onClone;
    return (
      <div>
        <a href={cancelHref}>Cancel</a>
        {extraActions}
      </div>
    );
  },
}));

vi.mock('@/features/homework/edit/homework-delete-button', () => ({
  default: ({ tid }: { tid: string }) => (
    <button type="button">Delete {tid}</button>
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
      <HomeworkEditForm
        tid="abc123"
        defaultValues={getHomeworkCreateDefaults()}
        domainId="system"
        canClone
      />
    </NextIntlClientProvider>
  );
}

describe('homework edit form', () => {
  it('renders the delete action for the current homework', () => {
    renderEdit();
    expect(
      screen.getByRole('button', { name: 'Delete abc123' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/homework/abc123'
    );
  });

  it('clones with the create payload and returns the new homework path', async () => {
    const values = getHomeworkCreateDefaults();
    renderEdit();
    await expect(mocks.onClone!(values)).resolves.toBe('/homework/def456');
    expect(mocks.create).toHaveBeenCalledWith(
      buildCreateHomeworkPayload(values)
    );
    expect(mocks.edit).not.toHaveBeenCalled();
  });

  it('throws the clone failure message when the response has no tid', async () => {
    mocks.create.mockResolvedValue({});
    renderEdit();
    await expect(mocks.onClone!(getHomeworkCreateDefaults())).rejects.toThrow(
      messages.homeworkEdit.cloneFailed
    );
  });

  it('saves with the edit payload for the current homework', async () => {
    const values = getHomeworkCreateDefaults();
    renderEdit();
    await expect(mocks.onSubmit!(values)).resolves.toBe('/homework/abc123');
    expect(mocks.edit).toHaveBeenCalledWith(
      'abc123',
      buildCreateHomeworkPayload(values)
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
