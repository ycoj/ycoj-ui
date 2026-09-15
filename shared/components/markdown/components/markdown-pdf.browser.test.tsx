import MarkdownPdf, {
  isMixedContentPdfUrl,
  MarkdownPdfViewer,
} from './markdown-pdf';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('./react-pdf-viewer', () => ({
  default: ({ src }: { src: string }) => (
    <div
      aria-label="PDF document"
      data-src={src}
      role="document"
      style={{ width: 10, height: 10 }}
    />
  ),
}));

function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

function renderWithIntl(ui: ReactNode) {
  return render(ui, { wrapper: IntlWrapper });
}

test('passes a safe URL to the React-PDF viewer', async () => {
  const { container } = await renderWithIntl(
    <MarkdownPdf data-src="https://example.com/document.pdf" />
  );

  const viewer = page.getByRole('document', { name: 'PDF document' });
  await expect.element(viewer).toBeVisible();
  expect(viewer.element().getAttribute('data-src')).toBe(
    'https://example.com/document.pdf'
  );
  expect(container.querySelector('iframe')).toBeNull();
});

test('accepts the camel-cased sanitized data property', async () => {
  await renderWithIntl(<MarkdownPdf dataSrc="/document.pdf" />);

  const viewer = page.getByRole('document', { name: 'PDF document' });
  await expect.element(viewer).toBeVisible();
  expect(viewer.element().getAttribute('data-src')).toBe('/document.pdf');
});

test('renders nothing for a missing or unsafe URL', async () => {
  const { container, rerender } = await renderWithIntl(<MarkdownPdf />);
  expect(container).toBeEmptyDOMElement();

  await rerender(<MarkdownPdf data-src="javascript:alert(1)" />);
  expect(container).toBeEmptyDOMElement();
});

test('shows a warning for an HTTP PDF on an HTTPS page', async () => {
  await renderWithIntl(
    <MarkdownPdfViewer
      pageProtocol="https:"
      src="http://example.com/document.pdf"
    />
  );

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent(
      'This PDF uses HTTP and cannot be displayed on this HTTPS page.'
    );
  await expect
    .element(page.getByRole('document', { name: 'PDF document' }))
    .not.toBeInTheDocument();
});

test('allows an HTTP PDF when the page also uses HTTP', async () => {
  await renderWithIntl(
    <MarkdownPdfViewer
      pageProtocol="http:"
      src="http://example.com/document.pdf"
    />
  );

  const viewer = page.getByRole('document', { name: 'PDF document' });
  await expect.element(viewer).toBeVisible();
  expect(viewer.element().getAttribute('data-src')).toBe(
    'http://example.com/document.pdf'
  );
});

test('only identifies HTTP PDFs as mixed content on HTTPS pages', () => {
  expect(
    isMixedContentPdfUrl('http://example.com/document.pdf', 'https:')
  ).toBe(true);
  expect(
    isMixedContentPdfUrl('https://example.com/document.pdf', 'https:')
  ).toBe(false);
  expect(isMixedContentPdfUrl('/document.pdf', 'https:')).toBe(false);
  expect(isMixedContentPdfUrl('//example.com/document.pdf', 'https:')).toBe(
    false
  );
});
