import PasteContent from './paste-content';
import messages from '@/messages/en';
import Markdown from '@/shared/components/markdown';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('@/shared/components/markdown/components/react-pdf-viewer', () => ({
  default: () => null,
}));

const writeText = vi.hoisted(() => vi.fn());

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

function renderCode(content: string, language: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <p>Outside the code block</p>
      <PasteContent paste={{ content, language, mode: 'code' }} />
    </NextIntlClientProvider>
  );
}

function pre() {
  return document.querySelector('pre')!;
}

test.each(['', 'unknown-language', 'constructor'])(
  'escapes unknown language %j as plain text',
  async (language) => {
    const content = '  <img src=x onerror=alert(1)>\n\n';
    await renderCode(content, language);

    expect(pre().textContent).toBe(content);
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('pre span.pl-k')).toBeNull();
    expect(getComputedStyle(pre().parentElement!).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)'
    );
  }
);

test('highlights known languages without executing markup or changing whitespace', async () => {
  const content = '  const text = "<script>alert(1)</script>";\n\n';
  const { container } = await renderCode(content, 'javascript');

  expect(pre().textContent).toBe(content);
  expect(container.querySelector('script')).toBeNull();
  const spans = Array.from(pre().querySelectorAll('span'));
  expect(spans.length).toBeGreaterThan(0);
  const colors = new Set(spans.map((span) => getComputedStyle(span).color));
  expect(colors.size).toBeGreaterThanOrEqual(2);
});

test('copies the original code including whitespace', async () => {
  const content = '  const text = "<div>";\n\n';
  await renderCode(content, 'javascript');

  await page.getByRole('button', { name: 'Copy' }).click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  expect(writeText).toHaveBeenCalledWith(content);
  await expect
    .element(page.getByRole('button', { name: 'Copied' }))
    .toBeVisible();
});

test.each([
  ['javascript', '{Control>}a{/Control}'],
  ['javascript', '{Meta>}a{/Meta}'],
  ['unknown-language', '{Control>}a{/Control}'],
  ['unknown-language', '{Meta>}a{/Meta}'],
] as const)(
  'confines select all to %s code with %s',
  async (language, shortcut) => {
    const content = '  const text = "<div>";\n\n';
    await renderCode(content, language);

    const code = pre();
    code.focus();
    expect(document.activeElement).toBe(code);
    await userEvent.keyboard(shortcut);

    const selected = window.getSelection()?.toString() ?? '';
    expect(selected.replace(/\n+$/, '')).toBe(content.replace(/\n+$/, ''));
    expect(selected).not.toContain('Outside the code block');
  }
);

test('routes Markdown through the shared sanitized renderer', async () => {
  const paste = {
    mode: 'markdown' as const,
    language: '',
    content:
      '# Hello\n<script>alert(1)</script>\n<img src=x onerror="alert(1)">\n[bad](javascript:alert(1))',
  };
  const wrapper = PasteContent({ paste });
  const markdownElement = wrapper.props.children as ReactElement<{
    children: string;
  }>;
  expect(markdownElement.type).toBe(Markdown);
  const markdown = Markdown(markdownElement.props);
  const children = (markdown.props as { children: ReactNode }).children;
  const asyncMarkdown = Children.toArray(children)[0] as ReactElement<Options>;
  const rendered = await MarkdownAsync(asyncMarkdown.props);
  const { container } = await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {rendered}
    </NextIntlClientProvider>
  );

  const heading = page.getByRole('heading', { name: 'Hello' });
  await expect.element(heading).toBeVisible();
  expect(container.querySelector('script')).toBeNull();
  expect(container.querySelector('[onerror]')).toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
});
