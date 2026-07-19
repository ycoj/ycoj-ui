import MarkdownPdf, {
  isMixedContentPdfUrl,
  MarkdownPdfViewer,
} from './markdown-pdf';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockReactPdfViewer({ src }: { src: string }) {
      return <div aria-label="PDF document" data-src={src} role="document" />;
    },
}));

function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

const renderWithIntl = (ui: ReactNode) => render(ui, { wrapper: IntlWrapper });

describe('MarkdownPdf', () => {
  it('passes a safe URL to the React-PDF viewer', () => {
    const { container } = renderWithIntl(
      <MarkdownPdf data-src="https://example.com/document.pdf" />
    );

    expect(
      screen.getByRole('document', { name: 'PDF document' })
    ).toHaveAttribute('data-src', 'https://example.com/document.pdf');
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('accepts the camel-cased sanitized data property', () => {
    renderWithIntl(<MarkdownPdf dataSrc="/document.pdf" />);

    expect(
      screen.getByRole('document', { name: 'PDF document' })
    ).toHaveAttribute('data-src', '/document.pdf');
  });

  it('renders nothing for a missing or unsafe URL', () => {
    const { container, rerender } = renderWithIntl(<MarkdownPdf />);
    expect(container).toBeEmptyDOMElement();

    rerender(<MarkdownPdf data-src="javascript:alert(1)" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a warning for an HTTP PDF on an HTTPS page', () => {
    renderWithIntl(
      <MarkdownPdfViewer
        pageProtocol="https:"
        src="http://example.com/document.pdf"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This PDF uses HTTP and cannot be displayed on this HTTPS page.'
    );
    expect(screen.queryByRole('document')).not.toBeInTheDocument();
  });

  it('allows an HTTP PDF when the page also uses HTTP', () => {
    renderWithIntl(
      <MarkdownPdfViewer
        pageProtocol="http:"
        src="http://example.com/document.pdf"
      />
    );

    expect(
      screen.getByRole('document', { name: 'PDF document' })
    ).toHaveAttribute('data-src', 'http://example.com/document.pdf');
  });

  it('only identifies HTTP PDFs as mixed content on HTTPS pages', () => {
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
});
