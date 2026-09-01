'use client';

import ClientApis from '@/api/client/method';
import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import type {
  ListProjectionProblem,
  ProblemStatusDict,
} from '@/shared/types/problem';
import { useEffect, useRef, useState } from 'react';

export const OMNIBAR_DOMAIN_ID = 'system';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'failed';

export type SearchResults = {
  pdocs: ListProjectionProblem[];
  psdict: ProblemStatusDict;
  udocs: UserAutoCompleteItem[];
};

export type OmnibarSearchState = {
  query: string;
  status: Exclude<SearchStatus, 'idle'>;
  results: SearchResults;
};

export const emptyResults: SearchResults = {
  pdocs: [],
  psdict: {},
  udocs: [],
};

export function useOmnibarSearch() {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<OmnibarSearchState | null>(
    null
  );
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const requestId = useRef(0);
  const trimmedQuery = query.trim();
  const currentSearchState =
    searchState?.query === trimmedQuery ? searchState : null;
  const displayStatus: SearchStatus = trimmedQuery
    ? (currentSearchState?.status ?? 'loading')
    : 'idle';
  const displayResults = currentSearchState?.results ?? emptyResults;

  useEffect(() => {
    if (!trimmedQuery) {
      requestId.current += 1;
      return;
    }

    const currentRequestId = ++requestId.current;
    const timeout = window.setTimeout(() => {
      setSearchState({
        query: trimmedQuery,
        status: 'loading',
        results: emptyResults,
      });
      void Promise.all([
        ClientApis.Problem.searchOmnibarProblems(trimmedQuery).send(),
        ClientApis.User.searchUsers(OMNIBAR_DOMAIN_ID, trimmedQuery).send(),
      ])
        .then(([problems, users]) => {
          if (requestId.current !== currentRequestId) return;
          setSearchState({
            query: trimmedQuery,
            status: 'success',
            results: {
              pdocs: problems.pdocs,
              psdict: problems.psdict ?? {},
              udocs: users,
            },
          });
          setHighlightedIndex(
            problems.pdocs.length + users.length > 0 ? 0 : -1
          );
        })
        .catch(() => {
          if (requestId.current !== currentRequestId) return;
          setSearchState({
            query: trimmedQuery,
            status: 'failed',
            results: emptyResults,
          });
          setHighlightedIndex(-1);
        });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  return {
    query,
    setQuery,
    trimmedQuery,
    displayStatus,
    displayResults,
    highlightedIndex,
    setHighlightedIndex,
  };
}
