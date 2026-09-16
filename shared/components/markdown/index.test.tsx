import Markdown from '.';
import messages from '@/messages/en';
import { resolveFileUrls } from '@/shared/lib/resolve-file-urls';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ highlighterFactories: 0 }));

// Count how often the starry-night plugin builds its highlighter. Pages with
// many markdown blocks (preliminary papers render one per question and
// option) must not rebuild every grammar for each block.
vi.mock('rehype-starry-night', async (importOriginal) => {
  const actual = await importOriginal<typeof import('rehype-starry-night')>();
  return {
    default: (...args: Parameters<typeof actual.default>) => {
      mocks.highlighterFactories += 1;
      return actual.default(...args);
    },
  };
});

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

describe('Markdown highlighter reuse', () => {
  it('does not rebuild the syntax highlighter for every block', async () => {
    const builtBefore = mocks.highlighterFactories;

    await renderMarkdown('first block');
    await renderMarkdown('second block');

    expect(mocks.highlighterFactories).toBe(builtBefore);
  });
});

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

describe('Markdown code blocks', () => {
  it('renders a copy button on fenced code blocks', async () => {
    await renderMarkdown('```cpp\nint main() {}\n```');

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('does not add a copy button to inline code', async () => {
    await renderMarkdown('Use `printf` here.');

    expect(
      screen.queryByRole('button', { name: 'Copy' })
    ).not.toBeInTheDocument();
  });
});

describe('Markdown containers', () => {
  it('renders an info container with a title as an alert', async () => {
    await renderMarkdown(':::info[Heads up]\nPay **attention**.\n:::');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-blue-200');
    expect(alert).toHaveClass('not-prose');
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('attention').tagName).toBe('STRONG');
  });

  it.each([
    ['info', 'border-blue-200'],
    ['warning', 'border-yellow-200'],
    ['success', 'border-green-200'],
    ['error', 'border-red-200'],
  ] as const)(
    'renders the %s variant styling',
    async (variant, borderClass) => {
      await renderMarkdown(`:::${variant}\nMessage body\n:::`);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass(borderClass);
      expect(alert).toHaveTextContent('Message body');
    }
  );

  it('renders a container written across separate paragraphs', async () => {
    await renderMarkdown(':::warning\n\nWatch **out**\n\n:::');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Watch');
    expect(screen.getByText('out').tagName).toBe('STRONG');
  });

  it('renders an align container with the requested alignment', async () => {
    const { container } = await renderMarkdown(':::align{right}\nhello\n:::');

    expect(container.querySelector('.text-right')).toHaveTextContent('hello');
  });

  it('renders nested containers', async () => {
    await renderMarkdown(':::info[Outer]\n:::warning\ninner\n:::\n:::');

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveClass('border-blue-200');
    expect(alerts[0]).toHaveTextContent('Outer');
    expect(alerts[1]).toHaveClass('border-yellow-200');
    expect(alerts[1]).toHaveTextContent('inner');
    expect(alerts[0]).toContainElement(alerts[1]);
  });

  it('renders completed inner containers when the outer one is unterminated', async () => {
    await renderMarkdown(':::info\n\n:::warning\ninner\n:::\n');

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveClass('border-yellow-200');
    expect(screen.getByText(/:::info/)).toBeInTheDocument();
  });

  it('renders sibling containers one after another', async () => {
    await renderMarkdown(':::info\na\n:::\n\n:::error\nb\n:::');

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveClass('border-blue-200');
    expect(alerts[1]).toHaveClass('border-red-200');
  });

  it('keeps an unterminated container as plain text', async () => {
    await renderMarkdown(':::info\nnever closed');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/:::info/)).toBeInTheDocument();
  });

  it('keeps the tail of an expanded container that follows another one', async () => {
    await renderMarkdown(
      ':::error\nINJECTED\n:::\n\n:::info\nppppppppppppppppppppp\n\n:::'
    );

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent('INJECTED');
    expect(alerts[1]).toHaveTextContent('ppppppppppppppppppppp');
    expect(alerts[1]).not.toHaveTextContent('INJECTED');
    expect(alerts[1].querySelector('[role="alert"]')).toBeNull();
  });

  it('renders a container inside a blockquote', async () => {
    await renderMarkdown('> :::info\n> hi\n> :::');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('hi');
  });

  it('renders nested containers inside a blockquote', async () => {
    await renderMarkdown('> :::info\n> :::warning\n> inner\n> :::\n> :::');

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toContainElement(alerts[1]);
    expect(alerts[1]).toHaveTextContent('inner');
  });

  it('renders wrappers collected by an unterminated container', async () => {
    await renderMarkdown(':::info\n\n> :::warning\n> hi\n> :::');

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent('hi');
    expect(screen.getByText(/:::info/)).toBeInTheDocument();
  });

  it('re-parses compact bodies inside nested list items', async () => {
    const { container } = await renderMarkdown('  - :::info\n    hi\n    :::');

    expect(screen.getByRole('alert')).toHaveTextContent('hi');
    expect(container.querySelector('pre')).toBeNull();
  });

  it('renders a list inside a container', async () => {
    await renderMarkdown(':::info\n- a\n- b\n\n:::');

    const alert = screen.getByRole('alert');
    expect(alert.querySelector('ul')).not.toBeNull();
    expect(alert).toHaveTextContent('a');
    expect(alert).toHaveTextContent('b');
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
