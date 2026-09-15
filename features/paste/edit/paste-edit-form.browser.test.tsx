import PasteEditForm from './paste-edit-form';
import {
  buildPastePayload,
  getPasteDefaults,
  type PasteFormValues,
} from '@/features/paste/form/paste-form-utils';
import { pasteDoc, pasteOptions } from '@/features/paste/paste.test-utils';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  onSubmit: null as null | ((values: PasteFormValues) => Promise<string>),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Paste: {
      updatePaste: (id: string, payload: unknown) => ({
        send: () => mocks.update(id, payload),
      }),
    },
  },
}));
vi.mock('@/features/paste/form/paste-form', () => ({
  default: ({
    onSubmit,
    mode,
    extraActions,
    cancelHref,
  }: {
    onSubmit: (values: PasteFormValues) => Promise<string>;
    mode: 'create' | 'edit';
    extraActions?: (isSubmitting: boolean) => ReactNode;
    cancelHref?: string;
  }) => {
    mocks.onSubmit = onSubmit;
    return (
      <div>
        <h1>
          {mode === 'create' ? messages.paste.create : messages.paste.edit}
        </h1>
        <button type="button">
          {mode === 'create' ? messages.paste.share : messages.paste.save}
        </button>
        {extraActions?.(false)}
        {cancelHref && <a href={cancelHref}>Cancel</a>}
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
  mocks.update.mockResolvedValue({});
});

function renderEdit() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasteEditForm options={pasteOptions} paste={pasteDoc} />
    </NextIntlClientProvider>
  );
}

test('updates with the write payload and returns the known detail path', async () => {
  const values = getPasteDefaults(pasteOptions, pasteDoc);
  await renderEdit();

  await expect
    .element(page.getByRole('heading', { name: 'Edit snippet' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Delete abc123' }))
    .toBeVisible();
  const cancel = page.getByRole('link', { name: 'Cancel' });
  await expect.element(cancel).toBeVisible();
  expect(cancel.element().getAttribute('href')).toBe('/paste/abc123');

  await expect(mocks.onSubmit!(values)).resolves.toBe('/paste/abc123');
  expect(mocks.update).toHaveBeenCalledWith(
    'abc123',
    buildPastePayload(values)
  );
});

test('throws a parsed permission error without requiring a url', async () => {
  mocks.update.mockResolvedValue({
    error: { name: 'ForbiddenError', message: 'Permission denied' },
  });
  await renderEdit();

  await expect(
    mocks.onSubmit!(getPasteDefaults(pasteOptions, pasteDoc))
  ).rejects.toThrow('Permission denied');
});
