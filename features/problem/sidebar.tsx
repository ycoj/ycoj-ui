import ContestInfo from '@/features/contest/contest-info';
import ContestStatusBadge from '@/features/contest/contest-status';
import {
  formatContestDuration,
  getContestStatus,
} from '@/features/contest/detail/contest-utils';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import { RuleTexts } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type { ContestListProjectionProblem } from '@/shared/types/problem';
import {
  ArrowLeftIcon,
  Book03Icon,
  Chat01Icon,
  File01Icon,
  Navigation03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import dayjs from 'dayjs';
import Link from 'next/link';

type Props = {
  allowSubmit?: boolean;
  showBackToProblem?: boolean;

  discussionCount?: number;
  solutionCount?: number;

  problem: ContestListProjectionProblem;
  tid?: string;
  contest?: Contest | Homework;
  contestStatus?: ContestStatus;
};

type SidebarButtonProps = {
  icon: IconSvgElement;
  text: string;
  href: string;
  count?: number;
};

function withTid(href: string, tid?: string) {
  if (!tid) return href;

  const query = new URLSearchParams({ tid });
  return `${href}?${query.toString()}`;
}

function getContestProblemLabel(index: number) {
  if (index < 26) return String.fromCharCode(65 + index);
  return `P${index + 1}`;
}

function SidebarButton({ icon, text, href, count }: SidebarButtonProps) {
  return (
    <Button
      asChild
      className="h-10 w-full justify-start gap-3 px-4"
      variant="ghost"
    >
      <Link href={href}>
        <HugeiconsIcon icon={icon} strokeWidth={2} />
        <span data-llm-text={text}>{text}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="ml-auto">
            {count}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

export default function ProblemSidebar({
  allowSubmit,
  showBackToProblem,
  discussionCount,
  solutionCount,
  problem,
  tid,
  contest,
}: Props) {
  const isContestMode = Boolean(tid);
  const problemCount = contest?.pids?.length ?? 0;
  const beginAtText = contest
    ? dayjs(contest.beginAt).format('YYYY-MM-DD HH:mm')
    : '';
  const endAtText = contest
    ? dayjs(contest.endAt).format('YYYY-MM-DD HH:mm')
    : '';
  const durationText = contest
    ? formatContestDuration(contest.beginAt, contest.endAt) || '-'
    : '-';
  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      <div className="space-y-1">
        {allowSubmit && (
          <Button asChild className="h-10 w-full justify-start gap-3 px-4">
            <Link
              href={withTid(
                `/problem/${problem.pid ?? problem.docId}/submit`,
                tid
              )}
            >
              <HugeiconsIcon icon={Navigation03Icon} strokeWidth={2} />
              <span data-llm-text="提交">提交</span>
            </Link>
          </Button>
        )}
        {showBackToProblem && (
          <Button asChild className="h-10 w-full justify-start gap-3 px-4">
            <Link
              href={withTid(`/problem/${problem.pid ?? problem.docId}`, tid)}
            >
              <HugeiconsIcon icon={ArrowLeftIcon} strokeWidth={2} />
              <span data-llm-text="返回题目">返回题目</span>
            </Link>
          </Button>
        )}
        {!isContestMode && (
          <SidebarButton
            icon={Chat01Icon}
            text="讨论"
            href="#"
            count={discussionCount}
          />
        )}
        {!isContestMode && (
          <SidebarButton
            icon={Book03Icon}
            text="题解"
            href={withTid(
              `/problem/${problem.pid ?? problem.docId}/solution`,
              tid
            )}
            count={solutionCount}
          />
        )}
        <SidebarButton
          icon={File01Icon}
          text="文件"
          href={withTid(`/problem/${problem.pid ?? problem.docId}/files`, tid)}
        />
      </div>

      {isContestMode && contest && (
        <>
          <Separator />

          {contest.pids?.length ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 px-2">
                {contest.pids.map((contestPid, index) => {
                  const label = getContestProblemLabel(index);
                  const active = contestPid === problem.docId;

                  return (
                    <Button
                      key={contestPid}
                      asChild
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      className="h-8 min-w-8 px-2"
                    >
                      <Link
                        href={withTid(`/problem/${contestPid}`, tid)}
                        data-llm-text={label}
                      >
                        {label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {contest.pids?.length ? <Separator /> : null}

          <ContestInfo
            status={<ContestStatusBadge status={getContestStatus(contest)} />}
            rule={RuleTexts[contest.rule]}
            ruleText={RuleTexts[contest.rule]}
            problemCount={problemCount}
            beginAtText={beginAtText}
            endAtText={endAtText}
            durationText={durationText}
            attend={contest.attend}
          />
        </>
      )}
    </div>
  );
}
