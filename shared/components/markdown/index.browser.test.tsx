import Markdown from '.';
import messages from '@/messages/en';
import { resolveFileUrls } from '@/shared/lib/resolve-file-urls';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function markdownWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

async function markdownElement(source: string) {
  const markdown = Markdown({ children: source });
  const children = (markdown.props as { children: ReactNode }).children;
  const asyncMarkdown = Children.toArray(children)[0] as ReactElement<Options>;

  return MarkdownAsync(asyncMarkdown.props);
}

async function renderMarkdown(source: string) {
  return render(await markdownElement(source), { wrapper: markdownWrapper });
}

async function renderMarkdownDocument(source: string) {
  const rendered = await markdownElement(source);

  return render(<div className="markdown">{rendered}</div>, {
    wrapper: markdownWrapper,
  });
}

async function renderMarkdownWithKatex(source: string) {
  const markdown = Markdown({ children: source });
  const children = Children.toArray(
    (markdown.props as { children: ReactNode }).children
  );
  const asyncMarkdown = children[0] as ReactElement<Options>;
  const katexClientRender = children[1];
  const rendered = await MarkdownAsync(asyncMarkdown.props);

  return render(
    <div className="markdown">
      {rendered}
      {katexClientRender}
    </div>,
    { wrapper: markdownWrapper }
  );
}

describe('Markdown highlighter reuse', () => {
  it('does not rebuild the syntax highlighter for every block', async () => {
    const builtBefore = mocks.highlighterFactories;

    await renderMarkdown('first block');
    await renderMarkdown('second block');

    expect(mocks.highlighterFactories).toBe(builtBefore);
  });
});

describe('Markdown math rendering', () => {
  it('renders escaped percent signs alongside LaTeX commands', async () => {
    const { container } = await renderMarkdownWithKatex(
      String.raw`$50\% \le 100\%$`
    );

    await waitFor(() => {
      expect(container.querySelector('.katex-html')).toHaveTextContent(
        '50%≤100%'
      );
    });
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

describe('Markdown code block line numbers', () => {
  it('renders a line number per code line', async () => {
    const { container } = await renderMarkdown('```cpp\nint a;\nint b;\n```');

    const lines = container.querySelectorAll('.code-line');
    expect(lines).toHaveLength(2);
    // Chromium reports the counter() expression rather than the resolved
    // number; its presence means each line renders its own counter value.
    for (const line of lines) {
      expect(getComputedStyle(line, '::before').content).toBe(
        'counter(code-line)'
      );
      expect(getComputedStyle(line, '::before').display).toBe('inline-block');
    }
  });

  it('numbers fenced blocks without a language', async () => {
    const { container } = await renderMarkdown('```\nalpha\nbeta\n```');

    expect(container.querySelectorAll('.code-line')).toHaveLength(2);
  });

  it('omits numbers for a no-line-numbers language but still highlights', async () => {
    const { container } = await renderMarkdown(
      '```cpp|no-line-numbers\nint a;\n```'
    );

    expect(container.querySelectorAll('.code-line')).toHaveLength(0);
    expect(container.querySelector('.pl-k')).not.toBeNull();
    expect(container.querySelector('pre')).toHaveTextContent('int a;');
  });

  it('copies the original code without the line numbers', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await renderMarkdown('```cpp\nint a;\nint b;\n```');
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('int a;\nint b;\n');
  });

  it('keeps the divider aligned when numbers grow wider', async () => {
    const source = '```cpp\n' + 'int a;\n'.repeat(1000) + '```';
    const { container } = await renderMarkdown(source);

    const lines = container.querySelectorAll('.code-line');
    expect(lines).toHaveLength(1000);
    const gutterWidths = new Set(
      [...lines].map((line) => getComputedStyle(line, '::before').width)
    );

    expect(gutterWidths.size).toBe(1);
  });

  it('pads the number evenly on both sides of the divider', async () => {
    const { container } = await renderMarkdownDocument(
      '```cpp\nint a;\nint b;\n```'
    );

    const gutter = getComputedStyle(
      container.querySelector('.code-line')!,
      '::before'
    );

    expect(gutter.paddingLeft).toBe(gutter.paddingRight);
    expect(parseFloat(gutter.paddingLeft)).toBeGreaterThan(0);
  });

  it('extends the divider to the top and bottom edges of the block', async () => {
    const { container } = await renderMarkdown('```cpp\nint a;\nint b;\n```');
    const pre = container.querySelector('pre')!;

    const divider = getComputedStyle(pre, '::after');
    const gutterWidth = parseFloat(
      getComputedStyle(container.querySelector('.code-line')!, '::before').width
    );

    expect(divider.position).toBe('absolute');
    expect(divider.top).toBe('0px');
    expect(divider.bottom).toBe('0px');
    expect(parseFloat(divider.left)).toBeCloseTo(gutterWidth, 1);
  });

  it('leaves the outer horizontal inset around numbered code blocks to the container', async () => {
    const { container } = await renderMarkdownDocument('```cpp\nint a;\n```');

    const pre = getComputedStyle(container.querySelector('pre')!);
    expect(pre.paddingLeft).toBe('0px');
    expect(parseFloat(pre.paddingRight)).toBeGreaterThan(0);
  });

  it('keeps the prose inset for code blocks without line numbers', async () => {
    const { container } = await renderMarkdownDocument(
      '```cpp|no-line-numbers\nint a;\n```'
    );

    const pre = getComputedStyle(container.querySelector('pre')!);
    expect(parseFloat(pre.paddingLeft)).toBeGreaterThan(0);
  });

  it('widens the gutter to fit the largest line number', async () => {
    const block = (lineCount: number) =>
      '```cpp\n' +
      Array.from({ length: lineCount }, (_, index) => `int v${index};`).join(
        '\n'
      ) +
      '\n```';

    const { container: singleDigits } = await renderMarkdown(block(9));
    const { container: doubleDigits } = await renderMarkdown(block(10));

    const gutterWidth = (container: HTMLElement) =>
      parseFloat(
        getComputedStyle(container.querySelector('.code-line')!, '::before')
          .width
      );

    expect(gutterWidth(doubleDigits)).toBeGreaterThan(
      gutterWidth(singleDigits)
    );
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
