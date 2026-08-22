import ProblemContentEditor from './problem-content-editor';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/components/markdown-editor', () => ({
  default: ({
    value,
    onChange,
    disabled,
  }: {
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    disabled?: boolean;
  }) => (
    <textarea
      data-testid="statement-editor"
      value={value}
      disabled={disabled}
      onChange={(event) =>
        onChange?.({ target: { value: event.target.value } })
      }
    />
  ),
}));

function renderEditor(
  value: string,
  onChange: (serialized: string) => void = vi.fn(),
  locale = 'zh'
) {
  render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <ProblemContentEditor value={value} onChange={onChange} />
    </NextIntlClientProvider>
  );
  return onChange;
}

function editor() {
  return screen.getByTestId('statement-editor') as HTMLTextAreaElement;
}

describe('ProblemContentEditor', () => {
  it('renders all supported language tabs', () => {
    renderEditor('');

    for (const label of ['简体中文', '繁體中文', '한국어', 'English', '日本語'])
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
  });

  it('shows the first language with content initially', () => {
    renderEditor(JSON.stringify({ en: 'English statement' }));

    expect(editor()).toHaveValue('English statement');
  });

  it('switches the editor content when another tab is selected', () => {
    renderEditor(JSON.stringify({ zh: '中文题面', en: 'English statement' }));

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'English' }));
    expect(editor()).toHaveValue('English statement');

    fireEvent.mouseDown(screen.getByRole('tab', { name: '简体中文' }));
    expect(editor()).toHaveValue('中文题面');
  });

  it('keeps a Chinese-only statement as plain text', () => {
    const onChange = renderEditor('# 题面');

    fireEvent.change(editor(), { target: { value: '新题面' } });

    expect(onChange).toHaveBeenLastCalledWith('新题面');
  });

  it('serializes multiple languages to JSON in fixed order', () => {
    const onChange = renderEditor('中文题面');

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'English' }));
    fireEvent.change(editor(), { target: { value: 'English statement' } });

    expect(onChange).toHaveBeenLastCalledWith(
      JSON.stringify({ zh: '中文题面', en: 'English statement' })
    );
  });

  it('drops a language when its content is cleared', () => {
    const onChange = renderEditor(
      JSON.stringify({ zh: '中文题面', en: 'English statement' })
    );

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'English' }));
    fireEvent.change(editor(), { target: { value: '  ' } });

    expect(onChange).toHaveBeenLastCalledWith('中文题面');
  });
});
