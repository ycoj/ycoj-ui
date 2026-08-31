import PasteContent from './paste-content';
import messages from '@/messages/en.json';
import Markdown from '@/shared/components/markdown';
import { isSupportedCodeLanguage } from '@/shared/lib/code-highlighter';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/components/markdown/components/react-pdf-viewer', () => ({
  default: () => null,
}));

describe('paste content rendering', () => {
  it.each(['cpp', 'python', 'javascript'])('recognizes %s', (language) => {
    expect(isSupportedCodeLanguage(language)).toBe(true);
  });

  it.each(['', 'unknown-language', 'constructor'])(
    'escapes unknown language %j as plain text',
    (language) => {
      const content = '  <img src=x onerror=alert(1)>\n\n';
      const { container } = render(
        <PasteContent paste={{ content, language, mode: 'code' }} />
      );
      expect(container.querySelector('pre')?.textContent).toBe(content);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('span.pl-k')).toBeNull();
    }
  );

  it('highlights known languages without executing markup or changing whitespace', () => {
    const content = '  const text = "<script>alert(1)</script>";\n\n';
    const { container } = render(
      <PasteContent paste={{ content, language: 'javascript', mode: 'code' }} />
    );
    expect(container.querySelector('pre')?.textContent).toBe(content);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('span')).not.toBeNull();
  });

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
