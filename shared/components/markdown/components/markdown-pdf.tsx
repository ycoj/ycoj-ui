'use client';

import { getSafePdfUrl } from '@/shared/components/markdown/pdf-url';
import { TriangleAlert } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type Props = Record<string, unknown>;

type ViewerProps = {
  pageProtocol: string;
  src: string;
};

function subscribeToPageProtocol() {
  return () => undefined;
}

function getPageProtocol(): string | null {
  return window.location.protocol;
}

function getServerPageProtocol(): string | null {
  return null;
}

export function isMixedContentPdfUrl(src: string, pageProtocol: string) {
  if (pageProtocol !== 'https:') return false;

  try {
    return new URL(src, 'https://pdf.invalid').protocol === 'http:';
  } catch {
    return false;
  }
}

export function MarkdownPdfViewer({ pageProtocol, src }: ViewerProps) {
  if (isMixedContentPdfUrl(src, pageProtocol)) {
    const warning =
      'This PDF uses HTTP and cannot be displayed on this HTTPS page.';

    return (
      <div
        className="my-6 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 first:mt-0 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        data-llm-visible="true"
        role="alert"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="m-0!" data-llm-text={warning}>
          {warning}
        </p>
      </div>
    );
  }

  return (
    <iframe
      className="my-6 block h-[clamp(28rem,85vh,72rem)] w-full rounded-md border first:mt-0"
      loading="lazy"
      src={src}
      title="PDF document"
    />
  );
}

export default function MarkdownPdf(props: Props) {
  const src = getSafePdfUrl(props['data-src'] ?? props.dataSrc);
  const pageProtocol = useSyncExternalStore(
    subscribeToPageProtocol,
    getPageProtocol,
    getServerPageProtocol
  );

  if (!src || !pageProtocol) return null;

  return <MarkdownPdfViewer pageProtocol={pageProtocol} src={src} />;
}
