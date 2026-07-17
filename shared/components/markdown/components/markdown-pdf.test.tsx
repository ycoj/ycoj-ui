import MarkdownPdf, {
  isMixedContentPdfUrl,
  MarkdownPdfViewer,
} from './markdown-pdf';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MarkdownPdf', () => {
  it('renders a responsive native PDF iframe', () => {
    render(<MarkdownPdf data-src="https://example.com/document.pdf" />);

    const iframe = screen.getByTitle('PDF document');
    expect(iframe).toHaveAttribute('src', 'https://example.com/document.pdf');
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe).toHaveClass(
      'my-6',
      'block',
      'h-[clamp(28rem,85vh,72rem)]',
      'w-full',
      'rounded-md',
      'border',
      'first:mt-0'
    );
  });

  it('accepts the camel-cased sanitized data property', () => {
    render(<MarkdownPdf dataSrc="/document.pdf" />);

    expect(screen.getByTitle('PDF document')).toHaveAttribute(
      'src',
      '/document.pdf'
    );
  });

  it('renders nothing for a missing or unsafe URL', () => {
    const { container, rerender } = render(<MarkdownPdf />);
    expect(container).toBeEmptyDOMElement();

    rerender(<MarkdownPdf data-src="javascript:alert(1)" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a warning for an HTTP PDF on an HTTPS page', () => {
    render(
      <MarkdownPdfViewer
        pageProtocol="https:"
        src="http://example.com/document.pdf"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This PDF uses HTTP and cannot be displayed on this HTTPS page.'
    );
    expect(screen.queryByTitle('PDF document')).not.toBeInTheDocument();
  });

  it('allows an HTTP PDF when the page also uses HTTP', () => {
    render(
      <MarkdownPdfViewer
        pageProtocol="http:"
        src="http://example.com/document.pdf"
      />
    );

    expect(screen.getByTitle('PDF document')).toHaveAttribute(
      'src',
      'http://example.com/document.pdf'
    );
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
