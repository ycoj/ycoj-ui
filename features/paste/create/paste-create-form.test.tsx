import PasteCreateForm from './paste-create-form';
import {
  buildPastePayload,
  getPasteDefaults,
  type PasteFormValues,
} from '@/features/paste/form/paste-form-utils';
import { pasteOptions } from '@/features/paste/paste.test-utils';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  onSubmit: null as null | ((values: PasteFormValues) => Promise<string>),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Paste: {
      createPaste: (payload: unknown) => ({
        send: () => mocks.create(payload),
      }),
    },
  },
}));
vi.mock('@/features/paste/form/paste-form', () => ({
  default: ({
    onSubmit,
    mode,
  }: {
    onSubmit: (values: PasteFormValues) => Promise<string>;
    mode: 'create' | 'edit';
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
      </div>
    );
  },
}));

const values = {
  ...getPasteDefaults(pasteOptions),
  content: '  x\n\n',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onSubmit = null;
  mocks.create.mockResolvedValue({ id: 'new123' });
});

function renderCreate() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasteCreateForm options={pasteOptions} />
    </NextIntlClientProvider>
  );
}

describe('paste create form', () => {
  it('creates with the write payload and returns the detail path', async () => {
    renderCreate();
    expect(
      screen.getByRole('heading', { name: 'Share a snippet' })
    ).toBeInTheDocument();
    await expect(mocks.onSubmit!(values)).resolves.toBe('/paste/new123');
    expect(mocks.create).toHaveBeenCalledWith(buildPastePayload(values));
  });

  it('throws a parsed backend rate limit without treating url as success', async () => {
    mocks.create.mockResolvedValue({
      error: {
        name: 'RateLimitExceededError',
        message: 'Try again in {0} seconds.',
        params: ['60'],
      },
    });
    renderCreate();
    await expect(mocks.onSubmit!(values)).rejects.toThrow(
      'Try again in 60 seconds.'
    );
  });
});
