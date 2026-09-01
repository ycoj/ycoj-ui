'use client';

import OmnibarResults from './omnibar-results';
import { useOmnibarSearch } from './omnibar-search';
import {
  buildOmnibarHits,
  nextHighlightIndex,
  type OmnibarHit,
} from './omnibar-utils';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useRef } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function Omnibar({ open, onOpenChange }: Props) {
  const t = useTranslations('omnibar');
  const router = useRouter();
  const {
    query,
    setQuery,
    trimmedQuery,
    displayStatus,
    displayResults,
    highlightedIndex,
    setHighlightedIndex,
  } = useOmnibarSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(
    () => buildOmnibarHits(displayResults.pdocs, displayResults.udocs),
    [displayResults.pdocs, displayResults.udocs]
  );

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const selectHit = (hit: OmnibarHit) => {
    onOpenChange(false);
    router.push(hit.href);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        nextHighlightIndex(current, hits.length, 1)
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) =>
        nextHighlightIndex(current, hits.length, -1)
      );
      return;
    }
    if (event.key === 'Enter') {
      const hit = hits[highlightedIndex];
      if (!hit) return;
      event.preventDefault();
      selectHit(hit);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-[min(20vh,8rem)] left-1/2 z-50 flex max-h-[min(37.5rem,calc(100%-2rem))] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-xl shadow-xl outline-none"
          data-llm-visible="true"
        >
          <Dialog.Title className="sr-only" data-llm-text={t('openLabel')}>
            {t('openLabel')}
          </Dialog.Title>
          <div className="relative border-b">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              aria-controls="omnibar-results"
              aria-activedescendant={
                hits[highlightedIndex]?.id
                  ? `omnibar-${hits[highlightedIndex].id}`
                  : undefined
              }
              autoComplete="off"
              spellCheck={false}
              className="h-12 rounded-none border-0 pr-4 pl-10 text-base shadow-none focus-visible:ring-0 md:text-base"
            />
          </div>
          <OmnibarResults
            results={displayResults}
            status={displayStatus}
            query={trimmedQuery}
            hits={hits}
            highlightedIndex={highlightedIndex}
            onHighlight={setHighlightedIndex}
            onClose={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
