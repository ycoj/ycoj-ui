'use client';

import {
  buildOmnibarHits,
  lookupProblemStatus,
  nextHighlightIndex,
  type OmnibarHit,
} from './omnibar-utils';
import ClientApis from '@/api/client/method';
import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import { formatProblemPid } from '@/features/problem/lib/format-problem-pid';
import ProblemStatus from '@/features/problem/problem-status';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import type {
  ListProjectionProblem,
  ProblemStatusDict,
} from '@/shared/types/problem';
import { LoaderCircle, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SearchStatus = 'idle' | 'loading' | 'success' | 'failed';

type SearchResults = {
  pdocs: ListProjectionProblem[];
  psdict: ProblemStatusDict;
  udocs: UserAutoCompleteItem[];
};

const emptyResults: SearchResults = {
  pdocs: [],
  psdict: {},
  udocs: [],
};

export default function Omnibar({ open, onOpenChange }: Props) {
  const t = useTranslations('omnibar');
  const userIdLabel = useTranslations('autoComplete');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const requestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightedRef = useRef<HTMLAnchorElement>(null);
  const trimmedQuery = query.trim();
  const hits = useMemo(
    () => (trimmedQuery ? buildOmnibarHits(results.pdocs, results.udocs) : []),
    [results.pdocs, results.udocs, trimmedQuery]
  );
  const displayStatus = trimmedQuery ? status : 'idle';
  const displayResults = trimmedQuery ? results : emptyResults;

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!trimmedQuery) {
      requestId.current += 1;
      return;
    }

    const currentRequestId = ++requestId.current;
    const timeout = window.setTimeout(() => {
      setStatus('loading');
      void Promise.all([
        ClientApis.Problem.searchOmnibarProblems(trimmedQuery).send(),
        ClientApis.User.searchUsers('system', trimmedQuery).send(),
      ])
        .then(([problems, users]) => {
          if (requestId.current !== currentRequestId) return;
          setResults({
            pdocs: problems.pdocs,
            psdict: problems.psdict ?? {},
            udocs: users,
          });
          setStatus('success');
          setHighlightedIndex(
            problems.pdocs.length + users.length > 0 ? 0 : -1
          );
        })
        .catch(() => {
          if (requestId.current !== currentRequestId) return;
          setStatus('failed');
        });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  useEffect(() => {
    highlightedRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex]);

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

  const showEmpty =
    Boolean(trimmedQuery) &&
    displayStatus === 'success' &&
    displayResults.pdocs.length === 0 &&
    displayResults.udocs.length === 0;
  const statusMessage =
    displayStatus === 'loading'
      ? t('loading')
      : displayStatus === 'failed'
        ? t('loadFailed')
        : showEmpty
          ? t('noResults')
          : undefined;

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
          <div
            id="omnibar-results"
            role="listbox"
            className="min-h-0 flex-1 overflow-y-auto p-2"
          >
            {statusMessage && (
              <div
                className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm"
                data-llm-text={statusMessage}
              >
                {displayStatus === 'loading' && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                {statusMessage}
              </div>
            )}
            {displayResults.pdocs.length > 0 && (
              <section className="mb-2">
                <h3
                  className="text-muted-foreground px-2 py-1.5 text-xs font-medium tracking-wide uppercase"
                  data-llm-text={t('problems')}
                >
                  {t('problems')}
                </h3>
                <div className="space-y-1">
                  {hits
                    .filter(
                      (hit): hit is Extract<OmnibarHit, { kind: 'problem' }> =>
                        hit.kind === 'problem'
                    )
                    .map((hit) => {
                      const index = hits.indexOf(hit);
                      const highlighted = index === highlightedIndex;
                      const statusDoc = lookupProblemStatus(
                        displayResults.psdict,
                        hit.problem.docId
                      );
                      const pid = formatProblemPid(hit.problem);
                      const acceptance = t('acceptance', {
                        accepted: hit.problem.nAccept,
                        submitted: hit.problem.nSubmit,
                      });
                      return (
                        <div
                          key={hit.id}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-2',
                            highlighted && 'bg-accent'
                          )}
                        >
                          {statusDoc && (
                            <div className="shrink-0 [&_[data-slot=badge]]:px-1.5">
                              <ProblemStatus status={statusDoc} />
                            </div>
                          )}
                          <Link
                            ref={highlighted ? highlightedRef : undefined}
                            id={`omnibar-${hit.id}`}
                            role="option"
                            aria-selected={highlighted}
                            href={hit.href}
                            prefetch={false}
                            className="min-w-0 flex-1 outline-none"
                            onClick={() => onOpenChange(false)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                          >
                            <div
                              className="truncate font-medium"
                              data-llm-text={hit.problem.title}
                            >
                              {hit.problem.title}
                            </div>
                            <div
                              className="text-muted-foreground text-xs"
                              data-llm-text={`${pid} ${acceptance}`}
                            >
                              {pid}
                              <span className="px-1">·</span>
                              {acceptance}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}
            {displayResults.udocs.length > 0 && (
              <section>
                <h3
                  className="text-muted-foreground px-2 py-1.5 text-xs font-medium tracking-wide uppercase"
                  data-llm-text={t('users')}
                >
                  {t('users')}
                </h3>
                <div className="space-y-1">
                  {hits
                    .filter(
                      (hit): hit is Extract<OmnibarHit, { kind: 'user' }> =>
                        hit.kind === 'user'
                    )
                    .map((hit) => {
                      const index = hits.indexOf(hit);
                      const highlighted = index === highlightedIndex;
                      const label = hit.user.displayName
                        ? `${hit.user.uname} (${hit.user.displayName})`
                        : hit.user.uname;
                      return (
                        <Link
                          key={hit.id}
                          ref={highlighted ? highlightedRef : undefined}
                          id={`omnibar-${hit.id}`}
                          role="option"
                          aria-selected={highlighted}
                          href={hit.href}
                          prefetch={false}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2 py-2 outline-none',
                            highlighted && 'bg-accent'
                          )}
                          onClick={() => onOpenChange(false)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                        >
                          <Avatar size="sm">
                            <AvatarImage src={hit.user.avatarUrl} alt="" />
                            <AvatarFallback>
                              {hit.user.uname.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div
                              className="truncate font-medium"
                              data-llm-text={label}
                            >
                              {label}
                            </div>
                            <div
                              className="text-muted-foreground text-xs"
                              data-llm-text={userIdLabel('userId', {
                                id: hit.user._id,
                              })}
                            >
                              {userIdLabel('userId', { id: hit.user._id })}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </section>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
