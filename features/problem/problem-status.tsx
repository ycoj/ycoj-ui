import { Badge } from '@/shared/components/ui/badge';
import {
  STATUS,
  STATUS_TEXT_KEYS,
  STATUS_BACKGROUND_COLOR,
} from '@/shared/configs/status';
import { ProblemStatus as ProblemStatusDoc } from '@/shared/types/problem';
import { CircleCheck, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  status: ProblemStatusDoc;
};

export default function ProblemStatus({ status }: Props) {
  const t = useTranslations('judgeStatus.label');
  if (status.status === undefined || status.status === null) return <></>;

  const statusCode = status.status;
  const statusKey = STATUS_TEXT_KEYS[statusCode];
  const statusText = statusKey ? t(statusKey) : undefined;
  const bgColor =
    STATUS_BACKGROUND_COLOR[statusCode as keyof typeof STATUS_BACKGROUND_COLOR];
  const isAccepted = statusCode === STATUS.STATUS_ACCEPTED;

  if (!statusText) return <></>;

  return (
    <Badge
      style={{
        backgroundColor: bgColor || '#6b7280',
      }}
      asChild
    >
      <Link href={status.rid ? `/record/${status.rid}` : '#'}>
        {isAccepted ? (
          <CircleCheck size={16} strokeWidth={3} />
        ) : (
          <XCircle size={16} strokeWidth={3} />
        )}
        <span className="hidden md:inline-block">{statusText}</span>
      </Link>
    </Badge>
  );
}
