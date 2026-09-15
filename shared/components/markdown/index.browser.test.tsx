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
      {rendered}
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
