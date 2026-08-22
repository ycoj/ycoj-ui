import ScoreboardCell from '@/features/contest/scoreboard/scoreboard-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/utils';
import type { ScoreboardRow } from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';

type Props = {
  rows: ScoreboardRow[];
  udict: BaseUserDict;
  pdict: ProblemDict;
  tid: string;
  pageType: 'contest' | 'homework';
  currentUid?: number;
};

const ICPC_BALLOON_COLORS = [
  '#dc2626',
  '#2563eb',
  '#facc15',
  '#16a34a',
  '#f97316',
  '#9333ea',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#64748b',
];

export function getProblemBalloonColors(
  headerRow: ScoreboardRow
): Map<number, string> {
  const colors = new Map<number, string>();
  let problemIndex = 0;
  headerRow.forEach((node, columnIndex) => {
    if (node.type === 'problem') {
      colors.set(
        columnIndex,
        ICPC_BALLOON_COLORS[problemIndex % ICPC_BALLOON_COLORS.length]
      );
      problemIndex += 1;
    }
  });
  return colors;
}

export function getOwnedBalloonColors(
  row: ScoreboardRow,
  problemColors: Map<number, string>
): string[] {
  return row.flatMap((node, columnIndex) => {
    const color = problemColors.get(columnIndex);
    return node.first === true && color ? [color] : [];
  });
}

export default function ScoreboardTable({
  rows,
  udict,
  pdict,
  tid,
  pageType,
  currentUid,
}: Props) {
  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const problemColors = getProblemBalloonColors(headerRow);

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          {headerRow.map((node, i) => (
            <TableHead key={i}>
              <ScoreboardCell
                node={node}
                isHeader
                pdict={pdict}
                tid={tid}
                pageType={pageType}
              />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dataRows.map((row, i) => {
          const userNode = row.find((n) => n.type === 'user');
          const ownedBalloonColors = getOwnedBalloonColors(row, problemColors);
          const isCurrentUser =
            currentUid != null && userNode?.raw === currentUid;
          return (
            <TableRow key={i} className={cn(isCurrentUser && 'bg-primary/5')}>
              {row.map((node, j) => (
                <TableCell key={j}>
                  <ScoreboardCell
                    node={node}
                    udict={udict}
                    pdict={pdict}
                    tid={tid}
                    pageType={pageType}
                    balloonColor={problemColors.get(j)}
                    ownedBalloonColors={
                      node.type === 'user' ? ownedBalloonColors : undefined
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
