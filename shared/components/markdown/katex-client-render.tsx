'use client';

import { useEffect, useRef } from 'react';

type Props = {
  source: string;
};

export default function KatexClientRender({ source }: Props) {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = markerRef.current?.parentElement;
    if (!container) {
      return;
    }

    let cancelled = false;

    const renderMath = async () => {
      const { default: renderMathInElement } =
        await import('katex/contrib/auto-render');

      if (cancelled) {
        return;
      }

      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      });
    };

    void renderMath();

    return () => {
      cancelled = true;
    };
  }, [source]);

  return <span ref={markerRef} className="hidden" aria-hidden="true" />;
}
