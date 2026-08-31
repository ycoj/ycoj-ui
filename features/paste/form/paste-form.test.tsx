import { pasteDoc, pasteOptions } from '../paste.test-utils';
import PasteForm from './paste-form';
import { getPasteDefaults } from './paste-form-utils';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
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

function renderForm(
  props: Partial<ComponentProps<typeof PasteForm>> & {
    paste?: typeof pasteDoc;
  } = {}
) {
  const { paste, ...rest } = props;
  const onSubmit = rest.onSubmit ?? vi.fn().mockResolvedValue('/paste/new123');
  const defaultValues =
    rest.defaultValues ?? getPasteDefaults(pasteOptions, paste);
  return {
    onSubmit,
    ...render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PasteForm
          mode={paste ? 'edit' : 'create'}
          options={pasteOptions}
          defaultValues={defaultValues}
          cancelHref={
            paste ? `/paste/${encodeURIComponent(paste._id)}` : undefined
          }
          onSubmit={onSubmit}
          {...rest}
        />
      </NextIntlClientProvider>
    ),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('paste form fields', () => {
  it('submits entered values and follows the returned path', async () => {
    const { onSubmit } = renderForm();
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: '  x\n\n' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: '',
        mode: 'code',
        language: 'cpp',
        content: '  x\n\n',
        expire: 'month',
      })
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

  it('rejects empty content without submitting', async () => {
    const { onSubmit } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByText('Enter some content.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['rust', ''])(
    'keeps saved language %j and expiry in submitted values',
    async (language) => {
      const { onSubmit } = renderForm({
        paste: { ...pasteDoc, language },
        onSubmit: vi.fn().mockResolvedValue('/paste/abc123'),
      });
      expect(screen.getByLabelText('Language')).toHaveValue(language);
      expect(screen.getByLabelText('Expiration')).toHaveValue('week');
      await userEvent.click(
        screen.getByRole('button', { name: 'Save changes' })
      );
      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'Example',
          mode: 'code',
          language,
          content: pasteDoc.content,
          expire: 'week',
        })
      );
      expect(mocks.push).toHaveBeenCalledWith('/paste/abc123');
    }
  );

  it('retains input and reports submit errors', async () => {
    const { onSubmit } = renderForm({
      onSubmit: vi
        .fn()
        .mockRejectedValue(new Error('Try again in 60 seconds.')),
    });
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
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled();
  });

  it('handles a failed submit and allows retrying', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue('/paste/abc123');
    renderForm({ paste: pasteDoc, onSubmit });
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

  it('disables fields while submitting', async () => {
    let resolve!: (value: string) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        })
    );
    renderForm({
      paste: pasteDoc,
      onSubmit,
      extraActions: <button type="button">Delete</button>,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveAttribute(
      'readOnly'
    );
    resolve('/paste/abc123');
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it('renders extra actions and cancel without tying them to validation', async () => {
    const extra = vi.fn();
    renderForm({
      paste: pasteDoc,
      extraActions: (
        <button type="button" onClick={extra}>
          Delete
        </button>
      ),
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Content' }), {
      target: { value: '' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(extra).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/paste/abc123'
    );
  });

  it('labels expiry from translations rather than backend copy', () => {
    renderForm();
    expect(screen.getByLabelText('Expiration')).toHaveTextContent('1 month');
  });

  it('derives heading and submit copy from mode, not extra actions', () => {
    const { unmount } = renderForm({
      extraActions: <button type="button">Extra</button>,
    });
    expect(
      screen.getByRole('heading', { name: 'Share a snippet' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    unmount();
    renderForm({ paste: pasteDoc });
    expect(
      screen.getByRole('heading', { name: 'Edit snippet' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save changes' })
    ).toBeInTheDocument();
  });
});
