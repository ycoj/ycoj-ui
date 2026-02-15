import UserSpan from '@/features/user/user-span';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import type { ScoreboardNode } from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  node: ScoreboardNode;
  isHeader?: boolean;
  udict?: BaseUserDict;
  pdict?: ProblemDict;
  tid?: string;
  pageType?: 'contest' | 'homework';
};

function getScoreColorClass(score: number): string {
  return cn(
    'font-semibold',
    score >= 100 && 'text-green-600',
    score >= 60 && score < 100 && 'text-orange-500',
    score < 60 && 'text-red-500'
  );
}

function renderByType(
  node: ScoreboardNode,
  ctx: {
    isHeader?: boolean;
    udict?: BaseUserDict;
    pdict?: ProblemDict;
    tid?: string;
    pageType?: 'contest' | 'homework';
  }
): ReactNode {
  const { isHeader, udict, tid, pageType } = ctx;

  switch (node.type) {
    case 'rank':
      return <span>{node.value}</span>;

    case 'user': {
      const uid = node.raw as number | undefined;
      const udoc = uid != null ? udict?.[uid] : undefined;
      if (udoc) {
        return <UserSpan user={udoc} showAvatar />;
      }
      return <span>{node.value}</span>;
    }

    case 'problem': {
      if (isHeader && tid && pageType) {
        const pid = node.raw as number | undefined;
        if (pid != null) {
          return (
            <Link href={`/${pageType}/${tid}/p/${pid}`}>{node.value}</Link>
          );
        }
      }
      return <span>{node.value}</span>;
    }

    case 'record': {
      const rid = node.raw as string | undefined;

      if (typeof node.value === 'number') {
        const className = getScoreColorClass(node.value);
        const content = <span className={className}>{node.value}</span>;
        if (rid) {
          return <Link href={`/record/${rid}`}>{content}</Link>;
        }
        return content;
      }

      const score = node.score ?? 0;
      const className = getScoreColorClass(score);
      const lines = node.value ? node.value.split('\n') : [];
      const content = (
        <span className={className}>
          {lines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      );
      if (rid) {
        return <Link href={`/record/${rid}`}>{content}</Link>;
      }
      return content;
    }

    case 'records': {
      const rids = node.raw as string[] | undefined;

      if (typeof node.value === 'number') {
        return <span>{node.value}</span>;
      }

      const lines = node.value ? node.value.split('\n') : [];
      if (rids && rids.length > 0) {
        return (
          <span>
            {lines.map((line: string, i: number) => (
              <span key={i}>
                {i > 0 && <br />}
                {rids[i] ? (
                  <Link href={`/record/${rids[i]}`}>{line}</Link>
                ) : (
                  line
                )}
              </span>
            ))}
          </span>
        );
      }
      return (
        <span>
          {lines.map((line: string, i: number) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      );
    }

    case 'total_score':
      return <span>{node.value}</span>;

    case 'time':
      return <span>{node.value}</span>;

    case 'solved':
      return <span>{node.value}</span>;

    case 'string':
      return <span>{node.value}</span>;

    case 'email':
      return <span>{node.value}</span>;

    default:
      return <span>{node.value}</span>;
  }
}

export default function ScoreboardCell({
  node,
  isHeader,
  udict,
  pdict,
  tid,
  pageType,
}: Props) {
  const content = renderByType(node, { isHeader, udict, pdict, tid, pageType });

  if (node.hover) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{content}</span>
        </TooltipTrigger>
        <TooltipContent>{node.hover}</TooltipContent>
      </Tooltip>
    );
  }

  if (node.style) {
    return <span>{content}</span>;
  }

  return content;
}
