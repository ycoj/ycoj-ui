import MarkdownEditor from '.';
import { cn } from '@/shared/lib/utils';
import type { EditorProps } from 'md-editor-rt';
import { NextIntlClientProvider } from 'next-intl';
import { createRef } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const editorProps = vi.hoisted(() => ({
  current: null as EditorProps | null,
}));
const theme = vi.hoisted(() => ({
  resolvedTheme: 'light',
}));

vi.mock('next-themes', () => ({
  useTheme: () => theme,
}));

vi.mock('md-editor-rt', () => ({
  MdEditor: (props: EditorProps) => {
    editorProps.current = props;

    return (
      <div
        data-testid="md-editor"
        className={cn('md-editor', props.className)}
        style={props.style}
      >
        <button type="button" onClick={() => props.onChange?.('updated')}>
          Change
        </button>
        <button
          type="button"
          onClick={() => props.onBlur?.(new FocusEvent('blur'))}
        >
          Blur
        </button>
      </div>
    );
  },
}));

function renderEditor(
  props: React.ComponentProps<typeof MarkdownEditor> = {},
  locale = 'en'
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <MarkdownEditor {...props} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  editorProps.current = null;
  theme.resolvedTheme = 'light';
});

test('configures md-editor-rt with the initial value and expected features', async () => {
  await renderEditor({ defaultValue: '# Initial' });

  const editor = page.getByTestId('md-editor');
  await expect.element(editor).toBeVisible();
  const bounds = editor.element().getBoundingClientRect();
  expect(bounds.height).toBeGreaterThan(0);

  expect(editorProps.current).toMatchObject({
    value: '# Initial',
    language: 'en-US',
    theme: 'light',
    preview: true,
    noUploadImg: true,
    toolbarsExclude: ['save', 'github'],
    style: { height: '40vh', minHeight: '20rem' },
  });
});

test('uses the dark editor theme when the application theme is dark', async () => {
  theme.resolvedTheme = 'dark';

  await renderEditor();

  await expect.element(page.getByTestId('md-editor')).toBeVisible();
  expect(editorProps.current?.theme).toBe('dark');
});

test('maps non-English locales to the built-in Chinese language', async () => {
  await renderEditor({}, 'zh');

  await expect.element(page.getByTestId('md-editor')).toBeVisible();
  expect(editorProps.current?.language).toBe('zh-CN');
});

test('updates the registered field once and blurs with the latest value', async () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const { container } = await renderEditor({
    name: 'content',
    defaultValue: 'initial',
    onChange,
    onBlur,
  });

  await userEvent.click(page.getByRole('button', { name: 'Change' }));
  await userEvent.click(page.getByRole('button', { name: 'Change' }));
  await userEvent.click(page.getByRole('button', { name: 'Blur' }));

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0][0].target).toMatchObject({
    name: 'content',
    value: 'updated',
  });
  expect(onBlur.mock.calls[0][0].target).toMatchObject({
    name: 'content',
    value: 'updated',
  });
  const hidden = container.querySelector<HTMLTextAreaElement>(
    'textarea[name="content"]'
  )!;
  expect(hidden.value).toBe('updated');
});

test('keeps the hidden field hidden and preserves its attributes and ref', async () => {
  const ref = createRef<HTMLTextAreaElement>();
  const { container } = await renderEditor({
    ref,
    id: 'content',
    name: 'content',
    disabled: true,
    required: true,
    className: 'custom-class',
    'aria-invalid': true,
  });

  await expect.element(page.getByTestId('md-editor')).toBeVisible();
  const hidden = container.querySelector<HTMLTextAreaElement>(
    'textarea[name="content"]'
  )!;
  expect(hidden).not.toBeNull();
  expect(getComputedStyle(hidden).display).toBe('none');
  expect(ref.current).toBe(hidden);
  expect(hidden.id).toBe('content');
  expect(hidden.name).toBe('content');
  expect(hidden.disabled).toBe(true);
  expect(hidden.required).toBe(true);
  expect(hidden.getAttribute('aria-invalid')).toBe('true');
  expect(editorProps.current?.disabled).toBe(true);
  expect((editorProps.current?.className as string).split(' ')).toEqual(
    expect.arrayContaining([
      'markdown-editor',
      'markdown-editor-invalid',
      'custom-class',
    ])
  );
});

test('switches the invalid border token when aria-invalid is set', async () => {
  const validView = await renderEditor({ className: 'probe' });
  const validEditor = page.getByTestId('md-editor');
  await expect.element(validEditor).toBeVisible();
  const validBorder = getComputedStyle(validEditor.element()).getPropertyValue(
    '--md-border-color'
  );
  expect(validBorder).not.toBe('');
  await validView.unmount();

  await renderEditor({ className: 'probe', 'aria-invalid': true });
  const invalidEditor = page.getByTestId('md-editor');
  await expect.element(invalidEditor).toBeVisible();
  const invalidBorder = getComputedStyle(
    invalidEditor.element()
  ).getPropertyValue('--md-border-color');
  expect(invalidBorder).not.toBe('');
  expect(invalidBorder).not.toBe(validBorder);
});
