import ProblemContentEditor from './problem-content-editor';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
  return page.getByTestId('statement-editor');
}

test('renders all supported language tabs', async () => {
  renderEditor('');

  for (const label of ['简体中文', '繁體中文', '한국어', 'English', '日本語']) {
    await expect.element(page.getByRole('tab', { name: label })).toBeVisible();
  }
});

test('shows the first language with content initially', async () => {
  renderEditor(JSON.stringify({ en: 'English statement' }));

  await expect.element(editor()).toHaveValue('English statement');
});

test('switches the editor content when another tab is selected', async () => {
  renderEditor(JSON.stringify({ zh: '中文题面', en: 'English statement' }));

  await userEvent.click(page.getByRole('tab', { name: 'English' }));
  await expect.element(editor()).toHaveValue('English statement');

  await userEvent.click(page.getByRole('tab', { name: '简体中文' }));
  await expect.element(editor()).toHaveValue('中文题面');
});

test('keeps a Chinese-only statement as plain text', async () => {
  const onChange = vi.fn();
  renderEditor('# 题面', onChange);

  await editor().fill('新题面');

  await expect.poll(() => onChange.mock.calls.at(-1)?.[0]).toBe('新题面');
});

test('serializes multiple languages to JSON in fixed order', async () => {
  const onChange = vi.fn();
  renderEditor('中文题面', onChange);

  await userEvent.click(page.getByRole('tab', { name: 'English' }));
  await editor().fill('English statement');

  await expect
    .poll(() => onChange.mock.calls.at(-1)?.[0])
    .toBe(JSON.stringify({ zh: '中文题面', en: 'English statement' }));
});

test('drops a language when its content is cleared', async () => {
  const onChange = vi.fn();
  renderEditor(
    JSON.stringify({ zh: '中文题面', en: 'English statement' }),
    onChange
  );

  await userEvent.click(page.getByRole('tab', { name: 'English' }));
  await editor().fill('  ');

  await expect.poll(() => onChange.mock.calls.at(-1)?.[0]).toBe('中文题面');
});
