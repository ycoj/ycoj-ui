'use client';

import type { SearchResults, SearchStatus } from './omnibar-search';
import { lookupProblemStatus, type OmnibarHit } from './omnibar-utils';
import { formatProblemPid } from '@/features/problem/lib/format-problem-pid';
import ProblemStatus from '@/features/problem/problem-status';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

type Props = {
  results: SearchResults;
  status: SearchStatus;
  query: string;
  hits: OmnibarHit[];
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onClose: () => void;
};

export default function OmnibarResults({
  results,
  status,
  query,
  hits,
  highlightedIndex,
  onHighlight,
  onClose,
}: Props) {
  const t = useTranslations('omnibar');
  const userIdLabel = useTranslations('autoComplete');
  const highlightedRef = useRef<HTMLAnchorElement>(null);
  const hitIndexes = new Map(hits.map((hit, index) => [hit.id, index]));
  const showEmpty =
    Boolean(query) &&
    status === 'success' &&
    results.pdocs.length === 0 &&
    results.udocs.length === 0;
  const statusMessage =
    status === 'loading'
      ? t('loading')
      : status === 'failed'
        ? t('loadFailed')
        : showEmpty
          ? t('noResults')
          : undefined;

  useEffect(() => {
    highlightedRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex]);

  return (
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
          {status === 'loading' && (
            <LoaderCircle className="size-4 animate-spin" />
          )}
          {statusMessage}
        </div>
      )}
      {results.pdocs.length > 0 && (
        <section className="mb-2">
          <h3
            className="text-muted-foreground px-2 py-1.5 text-xs font-medium tracking-wide uppercase"
            data-llm-text={t('problems')}
          >
            {t('problems')}
          </h3>
          <div className="space-y-1">
            {hits
              .filter((hit) => hit.kind === 'problem')
              .map((hit) => {
                const index = hitIndexes.get(hit.id)!;
                const highlighted = index === highlightedIndex;
                const statusDoc = lookupProblemStatus(
                  results.psdict,
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
                      <div
                        className="shrink-0 [&_[data-slot=badge]]:px-1.5"
                        onClick={onClose}
                      >
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
                      onClick={onClose}
                      onMouseEnter={() => onHighlight(index)}
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
      {results.udocs.length > 0 && (
        <section>
          <h3
            className="text-muted-foreground px-2 py-1.5 text-xs font-medium tracking-wide uppercase"
            data-llm-text={t('users')}
          >
            {t('users')}
          </h3>
          <div className="space-y-1">
            {hits
              .filter((hit) => hit.kind === 'user')
              .map((hit) => {
                const index = hitIndexes.get(hit.id)!;
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
                    onClick={onClose}
                    onMouseEnter={() => onHighlight(index)}
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
  );
}
