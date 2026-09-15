import Markdown from '.';
import messages from '@/messages/en';
import { resolveFileUrls } from '@/shared/lib/resolve-file-urls';
import { NextIntlClientProvider } from 'next-intl';
import { Children, type ReactElement, type ReactNode } from 'react';
import { MarkdownAsync, type Options } from 'react-markdown';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const writeText = vi.hoisted(() => vi.fn());

vi.mock('./components/react-pdf-viewer', () => ({
  default: () => (
    <div
      aria-label="PDF document"
      role="document"
      style={{ width: 10, height: 10 }}
    />
  ),
}));

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

async function renderMarkdown(source: string) {
  const markdown = Markdown({ children: source });
  const children = (markdown.props as { children: ReactNode }).children;
  const asyncMarkdown = Children.toArray(children)[0] as ReactElement<Options>;
  const rendered = await MarkdownAsync(asyncMarkdown.props);

  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div className="markdown">{rendered}</div>
    </NextIntlClientProvider>
  );
}

test('renders the custom PDF syntax through the sanitized pipeline', async () => {
  await renderMarkdown('@[pdf](https://example.com/document.pdf)');

  await expect
    .element(page.getByRole('document', { name: 'PDF document' }))
    .toBeVisible();
  expect(document.querySelector('iframe')).toBeNull();
});

test('does not allow a raw iframe', async () => {
  const { container } = await renderMarkdown(
    '<iframe src="https://example.com/document.pdf"></iframe>'
  );

  expect(container.querySelector('iframe')).toBeNull();
  await expect
    .element(page.getByRole('document', { name: 'PDF document' }))
    .not.toBeInTheDocument();
});

test('does not render an unsafe raw PDF custom element', async () => {
  const { container } = await renderMarkdown(
    '<pdf-embed data-src="javascript:alert(1)"></pdf-embed>'
  );

  expect(container.querySelector('iframe')).toBeNull();
  await expect
    .element(page.getByRole('document', { name: 'PDF document' }))
    .not.toBeInTheDocument();
});

test('renders a working copy button on fenced code blocks', async () => {
  await renderMarkdown('```cpp\nint main() {}\n```');

  const copy = page.getByRole('button', { name: 'Copy' });
  await expect.element(copy).toBeVisible();
  await copy.click();
  await expect.poll(() => writeText.mock.calls.length).toBe(1);
  await expect
    .element(page.getByRole('button', { name: 'Copied' }))
    .toBeVisible();
});

test('does not add a copy button to inline code', async () => {
  await renderMarkdown('Use `printf` here.');

  await expect
    .element(page.getByRole('button', { name: 'Copy' }))
    .not.toBeInTheDocument();
});

test('renders resolved attachment links and images through the sanitized pipeline', async () => {
  const source = resolveFileUrls(
    '[download](file://asset.zip)\n\n![image](file://image.jpg)',
    {
      baseUrl: '/api/p/42/file',
      filenames: ['asset.zip', 'image.jpg'],
    }
  );

  await renderMarkdown(source);

  const link = page.getByRole('link', { name: 'download' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe('/api/p/42/file/asset.zip');

  const image = page.getByRole('img', { name: 'image' });
  await expect.element(image).toBeVisible();
  expect(image.element().getAttribute('src')).toBe('/api/p/42/file/image.jpg');
});

const ALERT_STYLES: Record<string, [string, string, string]> = {
  info: [
    'oklch(0.882 0.059 254.128)',
    'oklch(0.97 0.014 254.604)',
    'oklch(0.488 0.243 264.376)',
  ],
  warning: [
    'oklch(0.945 0.129 101.54)',
    'oklch(0.987 0.026 102.212)',
    'oklch(0.476 0.114 61.907)',
  ],
  success: [
    'oklch(0.925 0.084 155.995)',
    'oklch(0.982 0.018 155.826)',
    'oklch(0.527 0.154 150.069)',
  ],
  error: [
    'oklch(0.885 0.062 18.334)',
    'oklch(0.971 0.013 17.38)',
    'oklch(0.505 0.213 27.518)',
  ],
};

async function alertColors(index = 0) {
  const alert = (await page.getByRole('alert').elements())[index];
  const style = getComputedStyle(alert);
  return [style.borderTopColor, style.backgroundColor, style.color];
}

test('renders an info container with a title as an alert', async () => {
  await renderMarkdown(':::info[Heads up]\nPay **attention**.\n:::');

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  const [border, background, color] = ALERT_STYLES.info;
  await expect.poll(alertColors).toEqual([border, background, color]);
  await expect
    .element(page.getByText('Heads up', { exact: true }))
    .toBeVisible();
  expect(page.getByText('attention', { exact: true }).element().tagName).toBe(
    'STRONG'
  );
});

test.each(Object.entries(ALERT_STYLES) as [string, string[]][])(
  'renders the %s variant styling',
  async (variant, [border, background, color]) => {
    await renderMarkdown(`:::${variant}\nMessage body\n:::`);

    const alert = page.getByRole('alert');
    await expect.element(alert).toBeVisible();
    await expect.element(alert).toHaveTextContent('Message body');
    await expect.poll(alertColors).toEqual([border, background, color]);
  }
);

test('keeps the alert variant colors readable in the dark theme', async () => {
  document.documentElement.classList.add('dark');
  await renderMarkdown(':::info\nMessage body\n:::');

  await expect
    .poll(alertColors)
    .toEqual([
      'oklab(0.379 -0.0113991 -0.145554 / 0.5)',
      'oklab(0.282 -0.00327904 -0.0909409 / 0.4)',
      'oklch(0.809 0.105 251.813)',
    ]);
});

test('keeps alert content out of the prose spacing rules', async () => {
  const { container } = await renderMarkdown(
    ':::info\nInside the alert.\n:::\n\nA plain paragraph.'
  );

  const alert = page.getByRole('alert').element();
  const outside = container.querySelector('.markdown > p')!;
  expect(getComputedStyle(alert.querySelector('p')!).marginBlockStart).toBe(
    '0px'
  );
  expect(getComputedStyle(outside).marginBlockStart).not.toBe('0px');
});

test('renders a container written across separate paragraphs', async () => {
  await renderMarkdown(':::warning\n\nWatch **out**\n\n:::');

  const alert = page.getByRole('alert');
  await expect.element(alert).toHaveTextContent('Watch');
  expect(page.getByText('out', { exact: true }).element().tagName).toBe(
    'STRONG'
  );
});

test('renders an align container with the requested alignment', async () => {
  await renderMarkdown(':::align{right}\nhello\n:::');

  const aligned = page
    .getByText('hello', { exact: true })
    .element().parentElement!;
  expect(getComputedStyle(aligned).textAlign).toBe('right');
  await expect.element(page.getByText('hello', { exact: true })).toBeVisible();
});

test('renders nested containers', async () => {
  await renderMarkdown(':::info[Outer]\n:::warning\ninner\n:::\n:::');

  const alerts = await page.getByRole('alert').elements();
  expect(alerts).toHaveLength(2);
  await expect.poll(() => alertColors(0)).toEqual(ALERT_STYLES.info);
  await expect.element(page.getByText('Outer', { exact: true })).toBeVisible();
  await expect.poll(() => alertColors(1)).toEqual(ALERT_STYLES.warning);
  await expect.element(page.getByText('inner', { exact: true })).toBeVisible();
  expect(alerts[0].contains(alerts[1])).toBe(true);
});

test('renders completed inner containers when the outer one is unterminated', async () => {
  await renderMarkdown(':::info\n\n:::warning\ninner\n:::\n');

  await expect
    .poll(async () => page.getByRole('alert').elements().length)
    .toBe(1);
  await expect.poll(() => alertColors(0)).toEqual(ALERT_STYLES.warning);
  await expect.element(page.getByText(/:::info/)).toBeVisible();
});

test('renders sibling containers one after another', async () => {
  await renderMarkdown(':::info\na\n:::\n\n:::error\nb\n:::');

  await expect
    .poll(async () => page.getByRole('alert').elements().length)
    .toBe(2);
  await expect.poll(() => alertColors(0)).toEqual(ALERT_STYLES.info);
  await expect.poll(() => alertColors(1)).toEqual(ALERT_STYLES.error);
});

test('keeps an unterminated container as plain text', async () => {
  await renderMarkdown(':::info\nnever closed');

  await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  await expect.element(page.getByText(/:::info/)).toBeVisible();
});

test('keeps the tail of an expanded container that follows another one', async () => {
  await renderMarkdown(
    ':::error\nINJECTED\n:::\n\n:::info\nppppppppppppppppppppp\n\n:::'
  );

  const alerts = await page.getByRole('alert').elements();
  expect(alerts).toHaveLength(2);
  await expect
    .element(page.getByText('INJECTED', { exact: true }))
    .toBeVisible();
  const tail = page.getByText('ppppppppppppppppppppp', { exact: true });
  await expect.element(tail).toBeVisible();
  expect(alerts[1].textContent).not.toContain('INJECTED');
  expect(alerts[1].querySelector('[role="alert"]')).toBeNull();
});

test('renders a container inside a blockquote', async () => {
  await renderMarkdown('> :::info\n> hi\n> :::');

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('hi');
});

test('renders nested containers inside a blockquote', async () => {
  await renderMarkdown('> :::info\n> :::warning\n> inner\n> :::\n> :::');

  const alerts = await page.getByRole('alert').elements();
  expect(alerts).toHaveLength(2);
  expect(alerts[0].contains(alerts[1])).toBe(true);
  await expect.element(page.getByText('inner', { exact: true })).toBeVisible();
});

test('renders wrappers collected by an unterminated container', async () => {
  await renderMarkdown(':::info\n\n> :::warning\n> hi\n> :::');

  await expect
    .poll(async () => page.getByRole('alert').elements().length)
    .toBe(1);
  await expect.element(page.getByText(/:::info/)).toBeVisible();
});

test('re-parses compact bodies inside nested list items', async () => {
  const { container } = await renderMarkdown('  - :::info\n    hi\n    :::');

  await expect.element(page.getByRole('alert')).toHaveTextContent('hi');
  expect(container.querySelector('pre')).toBeNull();
});

test('renders a list inside a container', async () => {
  await renderMarkdown(':::info\n- a\n- b\n\n:::');

  const alert = page.getByRole('alert').element();
  expect(alert.querySelector('ul')).not.toBeNull();
  await expect.element(page.getByText('a', { exact: true })).toBeVisible();
  await expect.element(page.getByText('b', { exact: true })).toBeVisible();
});
