import type { GDoc, ScoreboardRow } from '@/shared/types/contest';

export const SCOREBOARD_FILTER_ALL = 'all';
export const SCOREBOARD_FILTER_RANKED = 'ranked';

/** A group `_id`, `all`, or `ranked`. Unknown values fall back to every row. */
export type ScoreboardFilter = string;

function getUserUid(row: ScoreboardRow): number | undefined {
  const userNode = row.find((node) => node.type === 'user');
  return typeof userNode?.raw === 'number' ? userNode.raw : undefined;
}

/**
 * Unranked participants carry a rank of `0`; every other row has a real rank.
 */
export function isRankedRow(row: ScoreboardRow): boolean {
  const rank = row.find((node) => node.type === 'rank')?.value;
  return rank !== 0 && rank !== '0';
}

/**
 * Coerces a URL filter into a value the select can represent, so an unknown or
 * stale query parameter degrades to the full scoreboard instead of an empty one.
 */
export function normalizeScoreboardFilter(
  filter: ScoreboardFilter | undefined,
  groups: GDoc[]
): ScoreboardFilter {
  if (filter === SCOREBOARD_FILTER_RANKED) return filter;
  if (filter && groups.some((group) => group._id === filter)) return filter;
  return SCOREBOARD_FILTER_ALL;
}

export function createScoreboardRowFilter(
  filter: ScoreboardFilter,
  groups: GDoc[]
): (row: ScoreboardRow) => boolean {
  if (filter === SCOREBOARD_FILTER_RANKED) return isRankedRow;
  const group = groups.find((item) => item._id === filter);
  if (!group) return () => true;
  const uids = new Set(group.uids ?? []);
  return (row) => {
    const uid = getUserUid(row);
    return uid !== undefined && uids.has(uid);
  };
}

/**
 * Filters participant rows while preserving the header row. An empty input is
 * returned untouched so callers can render their own empty state.
 */
export function filterScoreboardRows(
  rows: ScoreboardRow[],
  filter: ScoreboardFilter,
  groups: GDoc[]
): ScoreboardRow[] {
  if (rows.length === 0 || filter === SCOREBOARD_FILTER_ALL) return rows;
  const isRanked = filter === SCOREBOARD_FILTER_RANKED;
  if (!isRanked && !groups.some((group) => group._id === filter)) return rows;
  const [header, ...dataRows] = rows;
  return [
    header,
    ...dataRows.filter(createScoreboardRowFilter(filter, groups)),
  ];
}
