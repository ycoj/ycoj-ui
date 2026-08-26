import { type ProblemListResponse } from '@/api/server/method/problems/list';
import type { SearchParams } from '@/app/(app)/problem/(list)/page';
import { formatProblemPid } from '@/features/problem/lib/format-problem-pid';
import ProblemDifficulty from '@/features/problem/problem-difficulty';
import ProblemLink from '@/features/problem/problem-link';
import ProblemStatus from '@/features/problem/problem-status';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  data: ProblemListResponse;
  showTags: boolean;
  searchParams: SearchParams;
};

export default function ProblemList({ data, showTags, searchParams }: Props) {
  const t = useTranslations('problem');
  const common = useTranslations('common');
  const toggleShowTagsHref = `/problem?${new URLSearchParams({
    ...searchParams,
    showTags: String(!showTags),
  })}`;

  return (
    <Table className="table-fixed" data-llm-visible="true">
      <colgroup>
        <col className="w-12 md:w-32" />
        <col className="w-24" />
        <col />
        <col className="w-48" />
        <col className="w-28" />
        <col className="hidden w-24 md:table-column" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell>{common('status')}</TableCell>
          <TableCell>{common('problemId')}</TableCell>
          <TableCell>{common('problem')}</TableCell>
          <TableCell className="text-right">
            <Button variant="link" className="h-auto p-0 text-sm font-medium">
              <Link href={toggleShowTagsHref}>
                {showTags ? t('hideTags') : t('showTags')}
              </Link>
            </Button>
          </TableCell>
          <TableCell className="text-center">{t('difficulty')}</TableCell>
          <TableCell className="hidden text-center md:table-cell">
            {t('acceptanceRate')}
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.pdocs.map((problem) => (
          <TableRow key={problem.docId}>
            <TableCell>
              {data.psdict[problem.docId] && (
                <ProblemStatus status={data.psdict[problem.docId]} />
              )}
            </TableCell>
            <TableCell data-llm-text={formatProblemPid(problem)}>
              {formatProblemPid(problem)}
            </TableCell>
            <TableCell>
              <ProblemLink problem={problem} />
            </TableCell>
            <TableCell className="text-right">
              {showTags && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {problem.tag.map((tag) => (
                    <Badge variant="secondary" key={tag} data-llm-text={tag}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </TableCell>
            <TableCell className="text-center">
              <ProblemDifficulty difficulty={problem.difficulty} />
            </TableCell>
            <TableCell className="hidden text-center md:table-cell">
              <Progress
                className="h-2!"
                value={(problem.nAccept * 100) / problem.nSubmit}
                data-llm-text={`${Math.round((problem.nAccept * 100) / problem.nSubmit)}%`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
