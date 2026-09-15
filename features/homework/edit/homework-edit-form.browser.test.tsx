import HomeworkEditForm from './homework-edit-form';
import {
  buildCreateHomeworkPayload,
  getHomeworkCreateDefaults,
  type HomeworkFormValues,
} from '@/features/homework/form/homework-form-utils';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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
    extraActions?: (isSubmitting: boolean) => ReactNode;
    cancelHref: string;
  }) => {
    mocks.onSubmit = onSubmit;
    mocks.onClone = onClone ?? null;
    return (
      <div>
        <a href={cancelHref}>Cancel</a>
        {extraActions?.(false)}
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
      <HomeworkEditForm
        tid="abc123"
        defaultValues={getHomeworkCreateDefaults()}
        domainId="system"
        canClone
      />
    </NextIntlClientProvider>
  );
}

test('renders the delete action for the current homework', async () => {
  await renderEdit();

  await expect
    .element(page.getByRole('button', { name: 'Delete abc123' }))
    .toBeVisible();
  const cancel = page.getByRole('link', { name: 'Cancel' });
  await expect.element(cancel).toBeVisible();
  expect(cancel.element().getAttribute('href')).toBe('/homework/abc123');
});

test('clones with the create payload and returns the new homework path', async () => {
  const values = getHomeworkCreateDefaults();
  await renderEdit();

  await expect(mocks.onClone!(values)).resolves.toBe('/homework/def456');
  expect(mocks.create).toHaveBeenCalledWith(buildCreateHomeworkPayload(values));
  expect(mocks.edit).not.toHaveBeenCalled();
});

test('throws the clone failure message when the response has no tid', async () => {
  mocks.create.mockResolvedValue({});
  await renderEdit();

  await expect(mocks.onClone!(getHomeworkCreateDefaults())).rejects.toThrow(
    messages.homeworkEdit.cloneFailed
  );
});

test('throws the backend error message when the clone response is an error', async () => {
  mocks.create.mockResolvedValue({
    error: { name: 'ForbiddenError', message: 'Permission denied' },
  });
  await renderEdit();

  await expect(mocks.onClone!(getHomeworkCreateDefaults())).rejects.toThrow(
    'Permission denied'
  );
});

test('saves with the edit payload for the current homework', async () => {
  const values = getHomeworkCreateDefaults();
  await renderEdit();

  await expect(mocks.onSubmit!(values)).resolves.toBe('/homework/abc123');
  expect(mocks.edit).toHaveBeenCalledWith(
    'abc123',
    buildCreateHomeworkPayload(values)
  );
  expect(mocks.create).not.toHaveBeenCalled();
});

test('throws the backend error message when saving fails', async () => {
  mocks.edit.mockResolvedValue({
    error: { name: 'ForbiddenError', message: 'Permission denied' },
  });
  await renderEdit();

  await expect(mocks.onSubmit!(getHomeworkCreateDefaults())).rejects.toThrow(
    'Permission denied'
  );
});
