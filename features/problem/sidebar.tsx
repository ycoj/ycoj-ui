import {
  formatContestDuration,
  getContestStatus,
  getContestStatusLabel,
} from '@/features/contest/detail/contest-utils';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import type { Contest, ContestStatus, Homework } from '@/shared/types/contest';
import { RuleTexts } from '@/shared/types/contest';
import type { ContestListProjectionProblem } from '@/shared/types/problem';
import {
  Appointment01Icon,
  ArrowLeftIcon,
  Book03Icon,
  Calendar01Icon,
  ChampionIcon,
  Chat01Icon,
  Clock01Icon,
  CodeSquareIcon,
  File01Icon,
  Navigation03Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import dayjs from 'dayjs';
import Link from 'next/link';
import type { ReactNode } from 'react';

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

type InfoItemProps = {
  icon: IconSvgElement;
  label: string;
  value: ReactNode;
  llmText?: string;
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

function InfoItem({ icon, label, value, llmText }: InfoItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5">
        <HugeiconsIcon icon={icon} className="size-4" />
        <span>{label}</span>
      </div>
      <div className="text-right" data-llm-text={llmText}>
        {value}
      </div>
    </div>
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

          <div className="space-y-3 px-2">
            <InfoItem
              icon={Appointment01Icon}
              label="状态"
              value={getContestStatusLabel(getContestStatus(contest))}
              llmText={getContestStatusLabel(getContestStatus(contest))}
            />
            <InfoItem
              icon={ChampionIcon}
              label="比赛规则"
              value={RuleTexts[contest.rule]}
              llmText={RuleTexts[contest.rule]}
            />
            <InfoItem
              icon={CodeSquareIcon}
              label="题目数量"
              value={`${contest.pids.length} 道题`}
              llmText={String(contest.pids.length)}
            />
            <InfoItem
              icon={Calendar01Icon}
              label="开始时间"
              value={dayjs(contest.beginAt).format('YYYY-MM-DD HH:mm')}
              llmText={dayjs(contest.beginAt).format('YYYY-MM-DD HH:mm')}
            />
            <InfoItem
              icon={Calendar01Icon}
              label="结束时间"
              value={dayjs(contest.endAt).format('YYYY-MM-DD HH:mm')}
              llmText={dayjs(contest.endAt).format('YYYY-MM-DD HH:mm')}
            />
            <InfoItem
              icon={Clock01Icon}
              label="持续时间"
              value={
                formatContestDuration(contest.beginAt, contest.endAt) || '-'
              }
              llmText={
                formatContestDuration(contest.beginAt, contest.endAt) || '-'
              }
            />
            <InfoItem
              icon={UserGroupIcon}
              label="参赛人数"
              value={<span className="tabular-nums">{contest.attend}</span>}
              llmText={String(contest.attend)}
            />
          </div>

          {contest.pids?.length ? (
            <div className="space-y-2">
              <Separator />
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
        </>
      )}
    </div>
  );
}
