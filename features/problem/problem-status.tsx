import { Badge } from '@/shared/components/ui/badge';
import {
  STATUS,
  STATUS_CODES,
  STATUS_TEXT_KEYS,
  STATUS_BACKGROUND_COLOR,
} from '@/shared/configs/status';
import { ProblemStatus as ProblemStatusDoc } from '@/shared/types/problem';
import {
  AlignStartVertical,
  Ban,
  Bug,
  CircleCheck,
  CircleQuestionMark,
  CircleSlash,
  CircleX,
  Clock,
  FileExclamationPoint,
  FileOutput,
  LoaderCircle,
  MemoryStick,
  ServerCrash,
  ShieldX,
  Skull,
  Swords,
  Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const STATUS_ICONS: Record<number, LucideIcon> = {
  [STATUS.STATUS_WAITING]: Clock,
  [STATUS.STATUS_ACCEPTED]: CircleCheck,
  [STATUS.STATUS_WRONG_ANSWER]: CircleX,
  [STATUS.STATUS_TIME_LIMIT_EXCEEDED]: Timer,
  [STATUS.STATUS_MEMORY_LIMIT_EXCEEDED]: MemoryStick,
  [STATUS.STATUS_OUTPUT_LIMIT_EXCEEDED]: FileOutput,
  [STATUS.STATUS_RUNTIME_ERROR]: Bug,
  [STATUS.STATUS_COMPILE_ERROR]: FileExclamationPoint,
  [STATUS.STATUS_SYSTEM_ERROR]: ServerCrash,
  [STATUS.STATUS_CANCELED]: Ban,
  [STATUS.STATUS_ETC]: CircleQuestionMark,
  [STATUS.STATUS_HACKED]: Skull,
  [STATUS.STATUS_JUDGING]: LoaderCircle,
  [STATUS.STATUS_COMPILING]: LoaderCircle,
  [STATUS.STATUS_FETCHED]: LoaderCircle,
  [STATUS.STATUS_IGNORED]: CircleSlash,
  [STATUS.STATUS_FORMAT_ERROR]: AlignStartVertical,
  [STATUS.STATUS_HACK_SUCCESSFUL]: Swords,
  [STATUS.STATUS_HACK_UNSUCCESSFUL]: ShieldX,
};

const FALLBACK_COLOR = '#6b7280';

type Props = {
  status: ProblemStatusDoc;
  progress?: number;
};

export default function ProblemStatus({ status, progress }: Props) {
  const t = useTranslations('judgeStatus.label');
  if (status.status === undefined || status.status === null) return <></>;

  const statusCode = status.status;
  const statusKey = STATUS_TEXT_KEYS[statusCode];
  const statusText = statusKey ? t(statusKey) : undefined;
  const color =
    STATUS_BACKGROUND_COLOR[
      statusCode as keyof typeof STATUS_BACKGROUND_COLOR
    ] || FALLBACK_COLOR;
  const Icon = STATUS_ICONS[statusCode] ?? CircleQuestionMark;
  const statusCategory = STATUS_CODES[statusCode];
  const isPending = statusCategory === 'progress';

  if (!statusText) return <></>;

  const href = status.rid ? `/record/${status.rid}` : '#';
  const content = (
    <>
      <Icon
        size={16}
        strokeWidth={3}
        className={isPending ? 'animate-spin' : undefined}
      />
      <span className="hidden md:inline-block" data-llm-text={statusText}>
        {statusText}
      </span>
    </>
  );

  const progressPercent =
    typeof progress === 'number' && Number.isFinite(progress)
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : undefined;

  if (
    progressPercent === undefined ||
    (statusCategory !== 'progress' && statusCategory !== 'pending')
  ) {
    return (
      <Badge style={{ backgroundColor: color }} asChild>
        <Link href={href} data-llm-visible="true">
          {content}
        </Link>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="relative"
      style={{ borderColor: color, color }}
      asChild
    >
      <Link href={href} data-llm-visible="true">
        {content}
        <span
          aria-hidden
          className="absolute inset-0 inline-flex items-center justify-center gap-1 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground transition-[clip-path] [&>svg]:size-3!"
          style={{
            backgroundColor: color,
            clipPath: `inset(0 ${100 - progressPercent}% 0 0)`,
          }}
        >
          {content}
        </span>
      </Link>
    </Badge>
  );
}
