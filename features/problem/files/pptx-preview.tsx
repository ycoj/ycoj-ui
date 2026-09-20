'use client';

import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
};

type PptxPreviewer = {
  preview: (data: ArrayBuffer) => Promise<unknown>;
  destroy: () => void;
};

type PptxPreviewModule = {
  init: (
    element: HTMLElement,
    options: { width: number; height?: number; mode?: 'list' | 'slide' }
  ) => PptxPreviewer;
};

export default function PptxPreview({ src }: Props) {
  const t = useTranslations('problem.fileManager');
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let previewer: PptxPreviewer | undefined;

    const load = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok)
          throw new Error(`PPTX request failed: ${response.status}`);
        const data = await response.arrayBuffer();
        if (cancelled) return;

        const pptxModule = (await import('pptx-preview')) as PptxPreviewModule;
        if (cancelled) return;

        const width = Math.max(320, Math.floor(container.clientWidth));
        previewer = pptxModule.init(container, { mode: 'list', width });
        await previewer.preview(data);
        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
      previewer?.destroy();
      container.replaceChildren();
    };
  }, [src]);

  return (
    <div className="relative size-full overflow-auto bg-muted/60 p-3">
      <div
        ref={containerRef}
        aria-label={t('pptxDocument')}
        className="min-h-full min-w-full"
        role="document"
      />
      {status === 'loading' && (
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          <span>{t('previewLoading')}</span>
        </div>
      )}
      {status === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-sm text-destructive"
          role="alert"
        >
          <TriangleAlert className="size-5" aria-hidden="true" />
          <span>{t('previewError')}</span>
        </div>
      )}
    </div>
  );
}
