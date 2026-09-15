import { pasteDoc, pasteOptions } from '../paste.test-utils';
import PasteForm from './paste-form';
import { getPasteDefaults } from './paste-form-utils';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
  const onSubmit = rest.onSubmit
    ? vi.fn(rest.onSubmit)
    : vi.fn().mockResolvedValue('/paste/new123');
  const defaultValues =
    rest.defaultValues ?? getPasteDefaults(pasteOptions, paste);

  return {
    onSubmit,
    rendered: render(
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

test('submits entered values and follows the returned path', async () => {
  const { onSubmit, rendered } = renderForm();
  await rendered;

  await userEvent.fill(
    page.getByRole('textbox', { name: 'Content' }),
    '  x\n\n'
  );
  await userEvent.click(page.getByRole('button', { name: 'Share' }));

  await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
  expect(onSubmit).toHaveBeenCalledWith({
    title: '',
    mode: 'code',
    language: 'cpp',
    content: '  x\n\n',
    expire: 'month',
  });
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/paste/new123');
  expect(mocks.refresh).toHaveBeenCalled();
});

test('preserves content and selected language when changing modes', async () => {
  const { rendered } = renderForm();
  await rendered;

  await userEvent.fill(
    page.getByRole('textbox', { name: 'Content' }),
    '  # Header\n'
  );
  await userEvent.selectOptions(page.getByLabelText('Language'), 'python');
  await userEvent.selectOptions(page.getByLabelText('Type'), 'markdown');

  await expect.element(page.getByLabelText('Language')).not.toBeInTheDocument();
  await expect
    .element(page.getByLabelText('Markdown content'))
    .toHaveValue('  # Header\n');

  await userEvent.fill(page.getByLabelText('Markdown content'), '# Updated\n');
  await userEvent.selectOptions(page.getByLabelText('Type'), 'code');

  await expect.element(page.getByLabelText('Language')).toHaveValue('python');
  await expect
    .element(page.getByRole('textbox', { name: 'Content' }))
    .toHaveValue('# Updated\n');
});

test('rejects empty content without submitting', async () => {
  const { onSubmit, rendered } = renderForm();
  await rendered;

  await userEvent.click(page.getByRole('button', { name: 'Share' }));

  await expect
    .element(page.getByText('Enter some content.', { exact: true }))
    .toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
});

test.each(['rust', ''])(
  'keeps saved language %j and expiry in submitted values',
  async (language) => {
    const { onSubmit, rendered } = renderForm({
      paste: { ...pasteDoc, language },
      onSubmit: vi.fn().mockResolvedValue('/paste/abc123'),
    });
    await rendered;

    await expect.element(page.getByLabelText('Language')).toHaveValue(language);
    await expect.element(page.getByLabelText('Expiration')).toHaveValue('week');
    await userEvent.click(page.getByRole('button', { name: 'Save changes' }));

    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Example',
      mode: 'code',
      language,
      content: pasteDoc.content,
      expire: 'week',
    });
    await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
    expect(mocks.push).toHaveBeenCalledWith('/paste/abc123');
  }
);

test('retains input and reports submit errors', async () => {
  const { onSubmit, rendered } = renderForm({
    onSubmit: vi.fn().mockRejectedValue(new Error('Try again in 60 seconds.')),
  });
  await rendered;

  await userEvent.fill(
    page.getByRole('textbox', { name: 'Content' }),
    'my draft'
  );
  await userEvent.click(page.getByRole('button', { name: 'Share' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Try again in 60 seconds.');
  await expect
    .element(page.getByRole('textbox', { name: 'Content' }))
    .toHaveValue('my draft');
  expect(mocks.push).not.toHaveBeenCalled();
  expect(onSubmit).toHaveBeenCalledTimes(1);
  await expect
    .element(page.getByRole('button', { name: 'Share' }))
    .toBeEnabled();
});

test('handles a failed submit and allows retrying', async () => {
  const onSubmit = vi
    .fn()
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValue('/paste/abc123');
  const { rendered } = renderForm({ paste: pasteDoc, onSubmit });
  await rendered;

  await userEvent.click(page.getByRole('button', { name: 'Save changes' }));
  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Network unavailable');
  await expect
    .element(page.getByRole('textbox', { name: 'Content' }))
    .toHaveValue(pasteDoc.content);

  await userEvent.click(page.getByRole('button', { name: 'Save changes' }));
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/paste/abc123');
});

test('disables fields while submitting', async () => {
  let resolve!: (value: string) => void;
  const onSubmit = vi.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      })
  );
  const { rendered } = renderForm({
    paste: pasteDoc,
    onSubmit,
    extraActions: () => <button type="button">Delete</button>,
  });
  await rendered;

  await userEvent.click(page.getByRole('button', { name: 'Save changes' }));

  await expect
    .element(page.getByRole('button', { name: 'Saving…' }))
    .toBeDisabled();
  await expect
    .element(page.getByRole('textbox', { name: 'Content' }))
    .toHaveAttribute('readonly');

  resolve('/paste/abc123');
  await expect.poll(() => mocks.refresh.mock.calls.length).toBe(1);
});

test('renders extra actions and cancel without tying them to validation', async () => {
  const extra = vi.fn();
  const { rendered } = renderForm({
    paste: pasteDoc,
    extraActions: () => (
      <button type="button" onClick={extra}>
        Delete
      </button>
    ),
  });
  await rendered;

  await userEvent.fill(page.getByRole('textbox', { name: 'Content' }), '');
  await userEvent.click(page.getByRole('button', { name: 'Delete' }));

  expect(extra).toHaveBeenCalled();
  const cancel = page.getByRole('link', { name: 'Cancel' });
  await expect.element(cancel).toBeVisible();
  expect(cancel.element().getAttribute('href')).toBe('/paste/abc123');
});

test('labels expiry from translations rather than backend copy', async () => {
  const { rendered } = renderForm();
  await rendered;

  await expect
    .element(page.getByLabelText('Expiration'))
    .toHaveTextContent('1 month');
});

test('derives heading and submit copy from mode, not extra actions', async () => {
  const create = renderForm({
    extraActions: () => <button type="button">Extra</button>,
  });
  const createView = await create.rendered;

  await expect
    .element(page.getByRole('heading', { name: 'Share a snippet' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Share' }))
    .toBeVisible();
  await createView.unmount();

  const edit = renderForm({ paste: pasteDoc });
  await edit.rendered;

  await expect
    .element(page.getByRole('heading', { name: 'Edit snippet' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Save changes' }))
    .toBeVisible();
});
