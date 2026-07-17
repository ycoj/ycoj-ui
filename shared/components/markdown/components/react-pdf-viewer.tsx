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

export default function ReactPdfViewer({ src }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;

      setPageWidth(
        Math.max(0, Math.floor(entry.contentRect.width - VIEWER_PADDING * 2))
      );
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="size-full overflow-auto bg-muted/60 p-3">
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
          {pageWidth > 0 &&
            Array.from({ length: pageCount }, (_, index) => (
              <Page
                key={`page-${index + 1}`}
                className="overflow-hidden bg-white shadow-sm"
                pageNumber={index + 1}
                width={pageWidth}
              />
            ))}
        </Document>
      </div>
    </div>
  );
}
