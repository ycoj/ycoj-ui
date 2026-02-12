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
