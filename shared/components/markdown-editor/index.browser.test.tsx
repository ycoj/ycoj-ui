import MarkdownEditor from '.';
import { fireEvent, render, screen } from '@testing-library/react';
import type { EditorProps } from 'md-editor-rt';
import { NextIntlClientProvider } from 'next-intl';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
      <div data-testid="md-editor" className={props.className}>
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

describe('MarkdownEditor', () => {
  beforeEach(() => {
    editorProps.current = null;
    theme.resolvedTheme = 'light';
  });

  it('configures md-editor-rt with the initial value and expected features', () => {
    renderEditor({ defaultValue: '# Initial' });

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

  it('uses the dark editor theme when the application theme is dark', () => {
    theme.resolvedTheme = 'dark';

    renderEditor();

    expect(editorProps.current?.theme).toBe('dark');
  });

  it('maps non-English locales to the built-in Chinese language', () => {
    renderEditor({}, 'zh');

    expect(editorProps.current?.language).toBe('zh-CN');
  });

  it('updates the registered field once and blurs with the latest value', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const { container } = renderEditor({
      name: 'content',
      defaultValue: 'initial',
      onChange,
      onBlur,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Blur' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target).toMatchObject({
      name: 'content',
      value: 'updated',
    });
    expect(onBlur.mock.calls[0][0].target).toMatchObject({
      name: 'content',
      value: 'updated',
    });
    expect(container.querySelector('textarea[name="content"]')).toHaveValue(
      'updated'
    );
  });

  it('preserves the hidden field attributes, ref, and custom state styles', () => {
    const ref = createRef<HTMLTextAreaElement>();
    renderEditor({
      ref,
      id: 'content',
      name: 'content',
      disabled: true,
      required: true,
      className: 'custom-class',
      'aria-invalid': true,
    });

    expect(editorProps.current?.disabled).toBe(true);
    expect(screen.getByTestId('md-editor')).toHaveClass(
      'markdown-editor',
      'markdown-editor-invalid',
      'custom-class'
    );
    expect(ref.current).toHaveAttribute('id', 'content');
    expect(ref.current).toHaveAttribute('name', 'content');
    expect(ref.current).toBeDisabled();
    expect(ref.current).toBeRequired();
    expect(ref.current).toHaveAttribute('aria-invalid', 'true');
  });
});
