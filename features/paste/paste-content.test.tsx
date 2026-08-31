import PasteContent from './paste-content';
import messages from '@/messages/en.json';
import Markdown from '@/shared/components/markdown';
import { isSupportedCodeLanguage } from '@/shared/lib/code-highlighter';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/components/markdown/components/react-pdf-viewer', () => ({
  default: () => null,
}));

function renderCode(content: string, language: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <p>Outside the code block</p>
      <PasteContent paste={{ content, language, mode: 'code' }} />
    </NextIntlClientProvider>
  );
}

describe('paste content rendering', () => {
  it.each(['cpp', 'python', 'javascript'])('recognizes %s', (language) => {
    expect(isSupportedCodeLanguage(language)).toBe(true);
  });

  it.each(['', 'unknown-language', 'constructor'])(
    'escapes unknown language %j as plain text',
    (language) => {
      const content = '  <img src=x onerror=alert(1)>\n\n';
      const { container } = renderCode(content, language);
      expect(container.querySelector('pre')?.textContent).toBe(content);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('span.pl-k')).toBeNull();
    }
  );

  it('highlights known languages without executing markup or changing whitespace', () => {
    const content = '  const text = "<script>alert(1)</script>";\n\n';
    const { container } = renderCode(content, 'javascript');
    expect(container.querySelector('pre')?.textContent).toBe(content);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('pre span')).not.toBeNull();
  });

  it.each(['javascript', 'unknown-language'])(
    'copies the original %s code including whitespace',
    async (language) => {
      const user = userEvent.setup();
      const content = '  const text = "<div>";\n\n';
      renderCode(content, language);
      await user.click(screen.getByRole('button', { name: 'Copy' }));
      expect(await navigator.clipboard.readText()).toBe(content);
      expect(
        screen.getByRole('button', { name: 'Copied' })
      ).toBeInTheDocument();
    }
  );

  it.each([
    ['javascript', 'ctrlKey'],
    ['javascript', 'metaKey'],
    ['unknown-language', 'ctrlKey'],
    ['unknown-language', 'metaKey'],
  ] as const)(
    'confines select all to %s code with %s',
    (language, modifier) => {
      const content = '  const text = "<div>";\n\n';
      const { container } = renderCode(content, language);
      const pre = container.querySelector('pre')!;
      pre.focus();
      expect(pre).toHaveFocus();

      const event = createEvent.keyDown(pre, { key: 'a', [modifier]: true });
      fireEvent(pre, event);

      expect(event.defaultPrevented).toBe(true);
      expect(window.getSelection()?.toString()).toBe(content);
    }
  );

  it('routes Markdown through the shared sanitized renderer', async () => {
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
    const asyncMarkdown = Children.toArray(
      children
    )[0] as ReactElement<Options>;
    const rendered = await MarkdownAsync(asyncMarkdown.props);
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        {rendered}
      </NextIntlClientProvider>
    );
    expect(container.querySelector('h1')).toHaveTextContent('Hello');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
