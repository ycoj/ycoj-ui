import { Badge } from '@/shared/components/ui/badge';
import {
  STATUS,
  STATUS_TEXTS,
  STATUS_BACKGROUND_COLOR,
} from '@/shared/configs/status';
import { ProblemStatus as ProblemStatusDoc } from '@/shared/types/problem';
import { CircleCheck, XCircle } from 'lucide-react';
import Link from 'next/link';

type Props = {
  status: ProblemStatusDoc;
};

export default function ProblemStatus({ status }: Props) {
  if (status.status === undefined || status.status === null) return <></>;

  const statusCode = status.status;
  const statusText = STATUS_TEXTS[statusCode as keyof typeof STATUS_TEXTS];
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
