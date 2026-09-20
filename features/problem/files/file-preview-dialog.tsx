'use client';

import PptxPreview from './pptx-preview';
import type { PreviewableFileType } from './previewable-file';
import { Button } from '@/shared/components/ui/button';
import type { FileInfo } from '@/shared/types/file';
import { LoaderCircle, TriangleAlert, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Dialog } from 'radix-ui';

type Props = {
  file: FileInfo | null;
  type: PreviewableFileType | null;
  url: string | null;
  loading: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
};

function PdfPreviewLoading() {
  const t = useTranslations('problem.fileManager');
  return (
    <div
      className="flex size-full items-center justify-center gap-2 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{t('previewLoading')}</span>
    </div>
  );
}

const DynamicReactPdfViewer = dynamic(
  () => import('@/shared/components/markdown/components/react-pdf-viewer'),
  { loading: PdfPreviewLoading, ssr: false }
);

export default function FilePreviewDialog({
  file,
  type,
  url,
  loading,
  error,
  onOpenChange,
}: Props) {
  const t = useTranslations('problem.fileManager');
  const open = file !== null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 flex h-[min(90vh,56rem)] w-[min(96vw,75rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border p-4 outline-none"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="min-w-0 pr-10 text-lg font-semibold"
            data-llm-text={
              file ? `${t('preview')}: ${file.name}` : t('preview')
            }
          >
            <span className="mr-2">{t('preview')}:</span>
            <span className="font-mono text-base font-normal">
              {file?.name}
            </span>
          </Dialog.Title>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-3 right-3"
            aria-label={t('close')}
            onClick={() => onOpenChange(false)}
          >
            <X />
          </Button>
          <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-md border">
            {loading ? (
              <div
                className="flex size-full items-center justify-center gap-2 text-sm text-muted-foreground"
                role="status"
              >
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                <span>{t('previewLoading')}</span>
              </div>
            ) : error ? (
              <div
                className="flex size-full flex-col items-center justify-center gap-2 p-6 text-sm text-destructive"
                role="alert"
              >
                <TriangleAlert className="size-5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : url && type === 'image' ? (
              <div className="flex size-full items-center justify-center overflow-auto bg-muted/60 p-4">
                {/* Signed file URLs cannot be known by next/image at build time. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={file?.name ?? t('preview')}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : url && type === 'pdf' ? (
              <DynamicReactPdfViewer key={url} src={url} />
            ) : url && type === 'pptx' ? (
              <PptxPreview key={url} src={url} />
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
