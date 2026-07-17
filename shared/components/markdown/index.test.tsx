import Markdown from '.';
import { render, screen } from '@testing-library/react';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./components/react-pdf-viewer', () => ({
  default: () => <div aria-label="PDF document" role="document" />,
}));

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

    expect(
      await screen.findByRole('document', { name: 'PDF document' })
    ).toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('does not allow a raw iframe', async () => {
    const { container } = await renderMarkdown(
      '<iframe src="https://example.com/document.pdf"></iframe>'
    );

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('document', { name: 'PDF document' })
    ).not.toBeInTheDocument();
  });

  it('does not render an unsafe raw PDF custom element', async () => {
    const { container } = await renderMarkdown(
      '<pdf-embed data-src="javascript:alert(1)"></pdf-embed>'
    );

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('document', { name: 'PDF document' })
    ).not.toBeInTheDocument();
  });
});
