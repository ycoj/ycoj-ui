import UserSpan from '@/features/user/user-span';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import type { ScoreboardNode } from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';
import { Balloon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  node: ScoreboardNode;
  isHeader?: boolean;
  udict?: BaseUserDict;
  pdict?: ProblemDict;
  tid?: string;
  pageType?: 'contest' | 'homework';
  balloonColor?: string;
  ownedBalloonColors?: string[];
};

type SerializedRecordNode = {
  value: string | number;
  raw?: unknown;
  score?: number;
  style?: string;
  hover?: string;
};

export function getScoreColorClass(score: number): string {
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
    ownedBalloonColors?: string[];
  }
): ReactNode {
  const { isHeader, udict, pdict, tid, ownedBalloonColors } = ctx;

  switch (node.type) {
    case 'rank':
      return <span>{node.value}</span>;

    case 'user': {
      const uid = node.raw as number | undefined;
      const udoc = uid != null ? udict?.[uid] : undefined;
      if (udoc) {
        return (
          <span className="inline-flex items-center gap-1.5">
            <UserSpan user={udoc} showAvatar />
            {ownedBalloonColors?.map((color, index) => (
              <FirstSolveIndicator
                key={`${color}-${index}`}
                color={color}
                compact
              />
            ))}
          </span>
        );
      }
      return <span>{node.value}</span>;
    }

    case 'problem': {
      if (isHeader) {
        const rawPid = node.raw as number | string | undefined;
        if (rawPid != null) {
          const problem = pdict?.[rawPid as number];
          const pid = problem?.pid ?? problem?.docId ?? rawPid;
          const href = tid ? `/problem/${pid}?tid=${tid}` : `/problem/${pid}`;
          return <Link href={href}>{node.value}</Link>;
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
      const rids = Array.isArray(node.raw)
        ? node.raw.filter((value): value is string => typeof value === 'string')
        : undefined;
      const records = Array.isArray(node.raw)
        ? node.raw.filter(isSerializedRecordNode)
        : [];

      if (records.length > 0) {
        return (
          <span>
            {records.map((record, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">/</span>}
                {renderByType(
                  { type: 'record', ...record },
                  { ...ctx, isHeader: false }
                )}
              </span>
            ))}
          </span>
        );
      }

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

function isSerializedRecordNode(value: unknown): value is SerializedRecordNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    (typeof value.value === 'string' || typeof value.value === 'number')
  );
}

function FirstSolveIndicator({
  rid,
  color,
  compact = false,
}: {
  rid?: string;
  color?: string;
  compact?: boolean;
}) {
  const t = useTranslations('scoreboard');
  const label = t('firstSolve');
  const balloon = (
    <Balloon
      aria-hidden="true"
      className={cn(compact ? 'size-3.5' : 'size-4', 'shrink-0 fill-current')}
      data-testid="first-solve-balloon"
      style={{ color: color ?? '#dc2626' }}
      strokeWidth={1.75}
    />
  );

  if (rid) {
    return (
      <Link href={`/record/${rid}`} aria-label={label}>
        {balloon}
      </Link>
    );
  }

  return (
    <span aria-label={label} role="img">
      {balloon}
    </span>
  );
}

function getFirstSolveRid(node: ScoreboardNode): string | undefined {
  if (node.type === 'record') {
    return typeof node.raw === 'string' ? node.raw : undefined;
  }
  if (node.type === 'records' && Array.isArray(node.raw)) {
    const first = node.raw[0];
    if (typeof first === 'string') {
      return first;
    }
    if (isSerializedRecordNode(first) && typeof first.raw === 'string') {
      return first.raw;
    }
  }
  return undefined;
}

export default function ScoreboardCell({
  node,
  isHeader,
  udict,
  pdict,
  tid,
  pageType,
  balloonColor,
  ownedBalloonColors,
}: Props) {
  const content = renderByType(node, {
    isHeader,
    udict,
    pdict,
    tid,
    pageType,
    ownedBalloonColors,
  });
  const isFirstSolve =
    node.first === true && (node.type === 'record' || node.type === 'records');
  const hoverContent = node.hover ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{content}</span>
      </TooltipTrigger>
      <TooltipContent>{node.hover}</TooltipContent>
    </Tooltip>
  ) : (
    content
  );

  return (
    <TooltipProvider>
      {isFirstSolve ? (
        <span className="inline-flex items-center gap-1.5 font-bold">
          {hoverContent}
          <FirstSolveIndicator
            rid={getFirstSolveRid(node)}
            color={balloonColor}
          />
        </span>
      ) : (
        hoverContent
      )}
    </TooltipProvider>
  );
}
