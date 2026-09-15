import PasteContent from './paste-content';
import messages from '@/messages/en.json';
import Markdown from '@/shared/components/markdown';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/components/markdown/components/react-pdf-viewer', () => ({
  default: () => null,
}));

describe('paste markdown routing', () => {
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
