import Markdown from '.';
import messages from '@/messages/en.json';
import { resolveFileUrls } from '@/shared/lib/resolve-file-urls';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
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

  return render(rendered, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
  });
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

describe('Markdown resolved file URLs', () => {
  it('renders resolved attachment links and images through the sanitized pipeline', async () => {
    const source = resolveFileUrls(
      '[download](file://asset.zip)\n\n![image](file://image.jpg)',
      {
        baseUrl: '/api/p/42/file',
        filenames: ['asset.zip', 'image.jpg'],
      }
    );

    await renderMarkdown(source);

    expect(screen.getByRole('link', { name: 'download' })).toHaveAttribute(
      'href',
      '/api/p/42/file/asset.zip'
    );
    expect(screen.getByRole('img', { name: 'image' })).toHaveAttribute(
      'src',
      '/api/p/42/file/image.jpg'
    );
  });
});
