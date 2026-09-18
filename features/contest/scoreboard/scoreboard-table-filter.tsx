'use client';

import {
  filterScoreboardRows,
  normalizeScoreboardFilter,
  SCOREBOARD_FILTER_ALL,
  SCOREBOARD_FILTER_RANKED,
} from './scoreboard-filter';
import ScoreboardTable from './scoreboard-table';
import { Button } from '@/shared/components/ui/button';
import type { GDoc, ScoreboardRow } from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type FormEvent } from 'react';

type Props = {
  rows: ScoreboardRow[];
  udict: BaseUserDict;
  pdict: ProblemDict;
  tid: string;
  pageType: 'contest' | 'homework';
  currentUid?: number;
  groups: GDoc[];
  filter?: string;
};

export default function ScoreboardTableFilter({
  rows,
  udict,
  pdict,
  tid,
  pageType,
  currentUid,
  groups,
  filter: initialFilter,
}: Props) {
  const t = useTranslations('scoreboard');
  const common = useTranslations('common');
  const [filter, setFilter] = useState(() =>
    normalizeScoreboardFilter(initialFilter, groups)
  );

  const visibleRows = useMemo(
    () => filterScoreboardRows(rows, filter, groups),
    [rows, filter, groups]
  );

  function applyFilter(next: string) {
    setFilter(next);
    const params = new URLSearchParams(window.location.search);
    if (next === SCOREBOARD_FILTER_ALL) {
      params.delete('filter');
    } else {
      params.set('filter', next);
    }
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('filter');
    applyFilter(
      normalizeScoreboardFilter(
        typeof value === 'string' ? value : undefined,
        groups
      )
    );
  }

  return (
    <div className="space-y-3">
      <form
        method="get"
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center justify-end gap-2"
      >
        <label htmlFor="scoreboard-filter" className="sr-only">
          {t('filterUsers')}
        </label>
        <select
          id="scoreboard-filter"
          name="filter"
          value={filter}
          onChange={(event) => applyFilter(event.target.value)}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:ring-3"
        >
          <option value={SCOREBOARD_FILTER_ALL}>{t('allUsers')}</option>
          <option value={SCOREBOARD_FILTER_RANKED}>{t('rankedUsers')}</option>
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          {common('filter')}
        </Button>
      </form>

      {visibleRows.length > 1 ? (
        <ScoreboardTable
          rows={visibleRows}
          udict={udict}
          pdict={pdict}
          tid={tid}
          pageType={pageType}
          currentUid={currentUid}
        />
      ) : (
        <p
          className="text-muted-foreground py-8 text-center text-sm"
          data-llm-text={t('noMatchingUsers')}
        >
          {t('noMatchingUsers')}
        </p>
      )}
    </div>
  );
}
