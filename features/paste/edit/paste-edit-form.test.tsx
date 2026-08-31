import PasteEditForm from './paste-edit-form';
import {
  buildPastePayload,
  getPasteDefaults,
  type PasteFormValues,
} from '@/features/paste/form/paste-form-utils';
import { pasteDoc, pasteOptions } from '@/features/paste/paste.test-utils';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/features/paste/edit/paste-delete-button', () => ({
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

describe('paste edit form', () => {
  it('updates with the write payload and returns the known detail path', async () => {
    const values = getPasteDefaults(pasteOptions, pasteDoc);
    renderEdit();
    expect(
      screen.getByRole('heading', { name: 'Edit snippet' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete abc123' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/paste/abc123'
    );
    await expect(mocks.onSubmit!(values)).resolves.toBe('/paste/abc123');
    expect(mocks.update).toHaveBeenCalledWith(
      'abc123',
      buildPastePayload(values)
    );
  });

  it('throws a parsed permission error without requiring a url', async () => {
    mocks.update.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    renderEdit();
    await expect(
      mocks.onSubmit!(getPasteDefaults(pasteOptions, pasteDoc))
    ).rejects.toThrow('Permission denied');
  });
});
