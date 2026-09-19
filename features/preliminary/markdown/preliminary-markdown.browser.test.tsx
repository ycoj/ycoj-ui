import PreliminaryMarkdown from '@/features/preliminary/markdown/preliminary-markdown';
import messages from '@/messages/en';
import Markdown from '@/shared/components/markdown';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it } from 'vitest';

function markdownWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

// PreliminaryMarkdown forwards to the shared Markdown component, which renders
// asynchronously; unpack the same way the shared markdown tests do.
async function renderPreliminaryMarkdown(source: string) {
  const markdown = PreliminaryMarkdown({ children: source });
  const rendered = Markdown(markdown.props as { children: string });
  const children = Children.toArray(
    (rendered.props as { children: ReactNode }).children
  );
  const asyncMarkdown = children[0] as ReactElement<Options>;

  return render(await MarkdownAsync(asyncMarkdown.props), {
    wrapper: markdownWrapper,
  });
}

describe('PreliminaryMarkdown circled markers', () => {
  it('wraps circled markers in code blocks in enlarged sans-serif spans', async () => {
    const { container } = await renderPreliminaryMarkdown(
      ['```cpp', 'int a = ① + b;  // ② fill here', '```'].join('\n')
    );

    const markers = container.querySelectorAll('pre code span.font-sans');
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveTextContent('①');
    expect(markers[1]).toHaveTextContent('②');
    expect(markers[0]).toHaveClass('text-[1.4em]');
  });

  it('keeps the marker text selectable and copyable', async () => {
    const { container } = await renderPreliminaryMarkdown(
      ['```cpp', 'return ①;', '```'].join('\n')
    );

    expect(container.querySelector('pre')).toHaveTextContent('return ①;');
  });

  it('leaves prose and inline code untouched', async () => {
    const { container } = await renderPreliminaryMarkdown(
      'prose ① stays and `inline ②` stays'
    );

    expect(container.querySelector('p code span')).toBeNull();
    expect(container.querySelector('span.font-sans')).toBeNull();
  });
});
