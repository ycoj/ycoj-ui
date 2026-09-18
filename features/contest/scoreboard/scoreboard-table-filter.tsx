'use client';

import {
  filterScoreboardRows,
  normalizeScoreboardFilter,
  SCOREBOARD_FILTER_ALL,
  SCOREBOARD_FILTER_RANKED,
} from './scoreboard-filter';
import ScoreboardTable from './scoreboard-table';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { GDoc, ScoreboardRow } from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

type Props = {
  rows: ScoreboardRow[];
  udict: BaseUserDict;
  pdict: ProblemDict;
  tid: string;
  pageType: 'contest' | 'homework';
  currentUid?: number;
  groups: GDoc[];
  filter?: string;
  children?: ReactNode;
};

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export default function ScoreboardTableFilter({
  rows,
  udict,
  pdict,
  tid,
  pageType,
  currentUid,
  groups,
  filter: initialFilter,
  children: toolbar,
}: Props) {
  const t = useTranslations('scoreboard');
  const common = useTranslations('common');
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {toolbar}
        <div>
          <label htmlFor="scoreboard-filter" className="sr-only">
            {t('filterUsers')}
          </label>
          {hydrated ? (
            <Select value={filter} onValueChange={applyFilter}>
              <SelectTrigger
                id="scoreboard-filter"
                className="w-48"
                aria-label={t('filterUsers')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectItem value={SCOREBOARD_FILTER_ALL}>
                  {t('allUsers')}
                </SelectItem>
                <SelectItem value={SCOREBOARD_FILTER_RANKED}>
                  {t('rankedUsers')}
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <form method="get" className="flex items-center gap-2">
              <label htmlFor="scoreboard-filter-no-script" className="sr-only">
                {t('filterUsers')}
              </label>
              <select
                id="scoreboard-filter-no-script"
                name="filter"
                defaultValue={filter}
                className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
              >
                <option value={SCOREBOARD_FILTER_ALL}>{t('allUsers')}</option>
                <option value={SCOREBOARD_FILTER_RANKED}>
                  {t('rankedUsers')}
                </option>
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
          )}
        </div>
      </div>

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
