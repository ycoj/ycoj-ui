import { pasteDoc, pasteOptions } from '../paste.test-utils';
import PasteForm from './paste-form';
import messages from '@/messages/en.json';
import type { PasteDoc } from '@/shared/types/paste';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Paste: {
      createPaste: (...args: unknown[]) => ({
        send: () => mocks.create(...args),
      }),
      updatePaste: (...args: unknown[]) => ({
        send: () => mocks.update(...args),
      }),
      deletePaste: (...args: unknown[]) => ({
        send: () => mocks.delete(...args),
      }),
    },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock('./paste-select', () => ({
  default: ({
    id,
    label,
    value,
    options,
    onChange,
    disabled,
  }: ComponentProps<typeof import('./paste-select').default>) => (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {Object.entries(options).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  ),
}));
vi.mock('@/shared/components/code/code-editor', () => ({
  default: ({
    value,
    onChange,
    readOnly,
    ariaLabel,
  }: ComponentProps<
    typeof import('@/shared/components/code/code-editor').default
  >) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));
vi.mock('@/shared/components/markdown-editor', () => ({
  default: ({
    value,
    onChange,
    disabled,
    name,
  }: ComponentProps<
    typeof import('@/shared/components/markdown-editor').default
  >) => (
    <textarea
      aria-label="Markdown content"
      name={name}
      value={value}
      disabled={disabled}
      onChange={(event) => void onChange?.(event)}
    />
  ),
}));

function renderForm(paste?: PasteDoc) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PasteForm options={pasteOptions} paste={paste} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ id: 'new123', url: '/paste/new123' });
  mocks.update.mockResolvedValue({ url: '/paste/abc123' });
  mocks.delete.mockResolvedValue({ url: '/paste' });
});

describe('paste form workflow', () => {
  it('creates a snippet with whitespace and redirects to its detail', async () => {
    renderForm();
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: '  x\n\n' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        '',
        'code',
        'cpp',
        '  x\n\n',
        'month'
      )
    );
    expect(mocks.push).toHaveBeenCalledWith('/paste/new123');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('preserves content and selected language when changing modes', async () => {
    renderForm();
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: '  # Header\n' },
    });
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'python');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'markdown');
    expect(screen.queryByLabelText('Language')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Markdown content')).toHaveValue(
      '  # Header\n'
    );
    fireEvent.change(screen.getByLabelText('Markdown content'), {
      target: { value: '# Updated\n' },
    });
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'code');
    expect(screen.getByLabelText('Language')).toHaveValue('python');
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveValue(
      '# Updated\n'
    );
  });

  it('rejects empty content without making a request', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('Enter some content.')).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(['rust', ''])(
    'updates saved language %j and expiry without coercion',
    async (language) => {
      renderForm({ ...pasteDoc, language });
      expect(screen.getByLabelText('Language')).toHaveValue(language);
      expect(screen.getByLabelText('Expiration')).toHaveValue('week');
      await userEvent.click(
        screen.getByRole('button', { name: 'Save changes' })
      );
      await waitFor(() =>
        expect(mocks.update).toHaveBeenCalledWith(
          'abc123',
          'Example',
          'code',
          language,
          pasteDoc.content,
          'week'
        )
      );
      expect(mocks.push).toHaveBeenCalledWith('/paste/abc123');
    }
  );

  it('retains input and reports backend rate limits', async () => {
    mocks.create.mockResolvedValue({
      error: {
        name: 'RateLimitExceededError',
        message: 'Try again in {0} seconds.',
        params: ['60'],
      },
    });
    renderForm();
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: 'my draft' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Try again in 60 seconds.'
    );
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveValue(
      'my draft'
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });

  it('handles network failures and allows retrying an edit', async () => {
    mocks.update.mockRejectedValueOnce(new Error('Network unavailable'));
    renderForm(pasteDoc);
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network unavailable'
    );
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveValue(
      pasteDoc.content
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/paste/abc123')
    );
  });

  it('disables competing mutations while saving', async () => {
    let resolve!: (value: { url: string }) => void;
    mocks.update.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    renderForm(pasteDoc);
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    resolve({ url: '/paste/abc123' });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it.each(['cancel', 'escape'])(
    'dismisses deletion with %s without sending a request',
    async (action) => {
      renderForm(pasteDoc);
      const trigger = screen.getByRole('button', { name: 'Delete' });
      await userEvent.click(trigger);
      const dialog = screen.getByRole('alertdialog', { name: 'Delete' });
      expect(dialog).toHaveAccessibleDescription(messages.paste.deleteConfirm);
      expect(mocks.delete).not.toHaveBeenCalled();
      expect(
        within(dialog).getByRole('button', { name: 'Cancel' })
      ).toHaveFocus();
      if (action === 'cancel') {
        await userEvent.click(
          within(dialog).getByRole('button', { name: 'Cancel' })
        );
      } else {
        await userEvent.keyboard('{Escape}');
      }
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(mocks.delete).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
      expect(trigger).toHaveFocus();
    }
  );

  it('deletes even when the current form content is invalid', async () => {
    renderForm(pasteDoc);
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: '' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      })
    );
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('abc123'));
    expect(mocks.push).toHaveBeenCalledWith('/paste');
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('shows deletion permission errors without navigating', async () => {
    mocks.delete.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    renderForm(pasteDoc);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the confirmation open and disables actions while deleting', async () => {
    let resolve!: (value: { url: string }) => void;
    mocks.delete.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    renderForm(pasteDoc);
    const save = screen.getByRole('button', { name: 'Save changes' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' })
    );
    expect(
      within(dialog).getByRole('button', { name: 'Deleting…' })
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' })
    ).toBeDisabled();
    expect(save).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(dialog).toBeInTheDocument();
    expect(mocks.delete).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
    resolve({ url: '/paste' });
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(mocks.push).toHaveBeenCalledWith('/paste');
  });
});
