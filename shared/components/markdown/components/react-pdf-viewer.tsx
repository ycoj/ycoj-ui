'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type Props = {
  src: string;
};

const VIEWER_PADDING = 12;
const DEFAULT_PAGE_ASPECT_RATIO = 1 / Math.SQRT2;
const MAX_PDF_PAGES = 500;
const PAGE_RENDER_MARGIN = '100% 0px';

const PDF_OPTIONS = {
  maxImageSize: 16_777_216,
  stopAtErrors: true,
  withCredentials: false,
} as const;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function PdfError() {
  const message = 'The PDF could not be displayed.';

  return (
    <div
      className="flex min-h-48 items-center justify-center gap-3 p-6 text-sm text-destructive"
      data-llm-visible="true"
      role="alert"
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      <p className="m-0!" data-llm-text={message}>
        {message}
      </p>
    </div>
  );
}

function PdfPageLimitWarning({ pageCount }: { pageCount: number }) {
  const message = `Only the first ${MAX_PDF_PAGES} of ${pageCount} pages are shown.`;

  return (
    <div
      className="flex items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
      data-llm-visible="true"
      role="alert"
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      <p className="m-0!" data-llm-text={message}>
        {message}
      </p>
    </div>
  );
}

type LazyPdfPageProps = {
  pageNumber: number;
  pageWidth: number;
  scrollContainer: HTMLDivElement;
};

function LazyPdfPage({
  pageNumber,
  pageWidth,
  scrollContainer,
}: LazyPdfPageProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(pageNumber === 1);
  const [pageAspectRatio, setPageAspectRatio] = useState(
    DEFAULT_PAGE_ASPECT_RATIO
  );

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry?.isIntersecting ?? false),
      {
        root: scrollContainer,
        rootMargin: PAGE_RENDER_MARGIN,
      }
    );

    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [scrollContainer]);

  return (
    <div
      ref={placeholderRef}
      className="max-w-full shrink-0 overflow-hidden bg-white shadow-sm"
      data-pdf-page={pageNumber}
      style={{ aspectRatio: pageAspectRatio, width: pageWidth }}
    >
      {isNearViewport && (
        <Page
          className="overflow-hidden bg-white"
          onLoadSuccess={({ height, width }) =>
            setPageAspectRatio(width / height)
          }
          pageNumber={pageNumber}
          width={pageWidth}
        />
      )}
    </div>
  );
}

export default function ReactPdfViewer({ src }: Props) {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(
    null
  );
  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const renderedPageCount = Math.min(pageCount, MAX_PDF_PAGES);

  useEffect(() => {
    if (!scrollContainer) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;

      setPageWidth(
        Math.max(0, Math.floor(entry.contentRect.width - VIEWER_PADDING * 2))
      );
    });

    resizeObserver.observe(scrollContainer);
    return () => resizeObserver.disconnect();
  }, [scrollContainer]);

  return (
    <div
      ref={setScrollContainer}
      className="size-full overflow-auto bg-muted/60 p-3"
    >
      <div aria-label="PDF document" role="document">
        <Document
          className="flex flex-col items-center gap-3"
          error={<PdfError />}
          file={src}
          loading={
            <div
              className="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
              role="status"
            >
              Loading PDF
            </div>
          }
          onLoadSuccess={({ numPages }) => setPageCount(numPages)}
          options={PDF_OPTIONS}
        >
          {pageCount > MAX_PDF_PAGES && (
            <PdfPageLimitWarning pageCount={pageCount} />
          )}
          {scrollContainer &&
            pageWidth > 0 &&
            Array.from({ length: renderedPageCount }, (_, index) => (
              <LazyPdfPage
                key={`page-${index + 1}`}
                pageNumber={index + 1}
                pageWidth={pageWidth}
                scrollContainer={scrollContainer}
              />
            ))}
        </Document>
      </div>
    </div>
  );
}
