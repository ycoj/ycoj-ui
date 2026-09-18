'use client';

import ClientApis from '@/api/client/method';
import UserSpan from '@/features/user/user-span';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  PROBLEM_FEEDBACK_STATUSES,
  type ProblemFeedbackManageData,
  type ProblemFeedbackStatus,
} from '@/shared/types/problem-feedback';
import { FileWarning, LoaderCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  data: ProblemFeedbackManageData;
};

export default function ProblemFeedbackList({ data }: Props) {
  const t = useTranslations('problemFeedback.manage');
  const locale = useLocale();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  };

  const updateStatus = async (id: string, status: ProblemFeedbackStatus) => {
    setUpdatingId(id);
    try {
      await ClientApis.Problem.updateProblemFeedbackStatus(id, status).send();
      toast.success(t('updated'));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t('failed')
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (!data.docs.length) {
    return (
      <Empty className="min-h-56 border" data-llm-visible="true">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileWarning />
          </EmptyMedia>
          <EmptyTitle data-llm-text={t('emptyTitle')}>
            {t('emptyTitle')}
          </EmptyTitle>
          <EmptyDescription data-llm-text={t('emptyDescription')}>
            {t('emptyDescription')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border" data-llm-visible="true">
      <Table className="min-w-3xl">
        <TableHeader>
          <TableRow>
            <TableHead>{t('problem')}</TableHead>
            <TableHead>{t('reporter')}</TableHead>
            <TableHead className="w-[40%]">{t('content')}</TableHead>
            <TableHead>{t('submittedAt')}</TableHead>
            <TableHead>{t('statusLabel')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.docs.map((feedback) => {
            const problem = data.pdict[feedback.pid];
            const reporter = data.udict[feedback.owner];
            const updating = updatingId === feedback._id;
            return (
              <TableRow key={feedback._id}>
                <TableCell>
                  <Link
                    href={`/problem/${problem?.pid ?? feedback.pid}`}
                    className="font-medium hover:underline"
                    prefetch={false}
                  >
                    {problem?.title ?? `#${feedback.pid}`}
                  </Link>
                </TableCell>
                <TableCell>
                  {reporter ? (
                    <UserSpan user={reporter} />
                  ) : (
                    `UID ${feedback.owner}`
                  )}
                </TableCell>
                <TableCell
                  className="max-w-md whitespace-pre-wrap break-words"
                  data-llm-text={feedback.content}
                >
                  {feedback.content}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(feedback.createdAt)}
                </TableCell>
                <TableCell>
                  <Select
                    value={feedback.status}
                    onValueChange={(status) =>
                      updateStatus(
                        feedback._id,
                        status as ProblemFeedbackStatus
                      )
                    }
                    disabled={updating}
                  >
                    <SelectTrigger
                      className="w-36"
                      aria-label={t('statusFor', {
                        problem: problem?.title ?? `#${feedback.pid}`,
                      })}
                    >
                      {updating ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {PROBLEM_FEEDBACK_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
