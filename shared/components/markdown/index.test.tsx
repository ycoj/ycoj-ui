import Markdown from '.';
import { render, screen } from '@testing-library/react';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it } from 'vitest';

async function renderMarkdown(source: string) {
  const markdown = Markdown({ children: source });
  const children = (markdown.props as { children: ReactNode }).children;
  const asyncMarkdown = Children.toArray(children)[0] as ReactElement<Options>;
  const rendered = await MarkdownAsync(asyncMarkdown.props);

  return render(rendered);
}

describe('Markdown PDF rendering', () => {
  it('renders the custom PDF syntax through the sanitized pipeline', async () => {
    await renderMarkdown('@[pdf](https://example.com/document.pdf)');

    const iframe = await screen.findByTitle('PDF document');
    expect(iframe).toHaveAttribute('src', 'https://example.com/document.pdf');
    expect(iframe).toHaveClass('first:mt-0');
  });

  it('does not allow a raw iframe', async () => {
    const { container } = await renderMarkdown(
      '<iframe src="https://example.com/document.pdf"></iframe>'
    );

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('does not render an unsafe raw PDF custom element', async () => {
    const { container } = await renderMarkdown(
      '<pdf-embed data-src="javascript:alert(1)"></pdf-embed>'
    );

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });
});
