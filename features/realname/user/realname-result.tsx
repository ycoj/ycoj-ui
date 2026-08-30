import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/shared/components/ui/table';
import type { RealnameResultData } from '@/shared/types/realname';
import {
  BadgeCheck,
  CircleAlert,
  CircleCheck,
  Clock3,
  Pencil,
} from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = {
  data: RealnameResultData;
};

export default async function RealnameResult({ data }: Props) {
  const [t, locale] = await Promise.all([
    getTranslations('realname'),
    getLocale(),
  ]);
  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  };

  if (data.exempt) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" data-llm-visible="true">
        <h1 className="text-2xl font-semibold" data-llm-text={t('resultTitle')}>
          {t('resultTitle')}
        </h1>
        <Alert>
          <BadgeCheck />
          <AlertTitle data-llm-text={t('exemptTitle')}>
            {t('exemptTitle')}
          </AlertTitle>
          <AlertDescription data-llm-text={t('exemptDescription')}>
            {t('exemptDescription')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock3,
      badge: 'secondary' as const,
      title: t('status.pendingTitle'),
    },
    approved: {
      icon: CircleCheck,
      badge: 'default' as const,
      title: t('status.approvedTitle'),
    },
    rejected: {
      icon: CircleAlert,
      badge: 'destructive' as const,
      title: t('status.rejectedTitle'),
    },
    none: {
      icon: CircleAlert,
      badge: 'outline' as const,
      title: t('status.noneTitle'),
    },
  }[data.status];
  const StatusIcon = statusConfig.icon;
  const graceDescription = data.inGrace
    ? t('grace.until', { deadline: formatDate(data.graceUntil) })
    : data.status === 'pending'
      ? t('grace.pendingExpired')
      : t('grace.rejectedExpired');

  return (
    <div className="mx-auto max-w-4xl space-y-5" data-llm-visible="true">
      <h1 className="text-2xl font-semibold" data-llm-text={t('resultTitle')}>
        {t('resultTitle')}
      </h1>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <StatusIcon className="size-5" aria-hidden="true" />
            <Badge variant={statusConfig.badge}>
              {t(`status.${data.status}`)}
            </Badge>
          </div>
          <CardTitle data-llm-text={statusConfig.title}>
            {statusConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {(data.status === 'pending' || data.status === 'rejected') && (
            <Alert variant={data.inGrace ? 'default' : 'destructive'}>
              {data.inGrace ? <Clock3 /> : <CircleAlert />}
              <AlertTitle>
                {data.inGrace ? t('grace.title') : t('grace.expiredTitle')}
              </AlertTitle>
              <AlertDescription data-llm-text={graceDescription}>
                {graceDescription}
              </AlertDescription>
            </Alert>
          )}
          {data.status === 'approved' && (
            <p
              className="text-sm text-muted-foreground"
              data-llm-text={t('status.approvedDescription')}
            >
              {t('status.approvedDescription')}
            </p>
          )}
          {data.status === 'rejected' && data.application?.rejectReason && (
            <p
              className="text-sm text-destructive"
              data-llm-text={t('reasonWithValue', {
                reason: data.application.rejectReason,
              })}
            >
              {t('reasonWithValue', { reason: data.application.rejectReason })}
            </p>
          )}
          {data.application && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-40 font-medium">
                    {t('form.realName')}
                  </TableCell>
                  <TableCell data-llm-text={data.application.realName}>
                    {data.application.realName}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    {t('form.school')}
                  </TableCell>
                  <TableCell data-llm-text={data.application.school}>
                    {data.application.school}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    {t('submittedAt')}
                  </TableCell>
                  <TableCell>
                    {formatDate(data.application.submittedAt)}
                  </TableCell>
                </TableRow>
                {data.application.reviewedAt && (
                  <TableRow>
                    <TableCell className="font-medium">
                      {t('reviewedAt')}
                    </TableCell>
                    <TableCell>
                      {formatDate(data.application.reviewedAt)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex flex-wrap gap-3">
            {(data.status === 'rejected' || data.status === 'none') && (
              <Button asChild>
                <Link href="/home/realname">
                  <Pencil />
                  {t('resubmit')}
                </Link>
              </Button>
            )}
            {data.status === 'pending' && (
              <Button asChild variant="secondary">
                <Link href="/home/realname">
                  <Pencil />
                  {t('form.update')}
                </Link>
              </Button>
            )}
            {(data.status === 'approved' || data.inGrace) && (
              <Button
                asChild
                variant={data.status === 'rejected' ? 'secondary' : 'default'}
              >
                <Link href="/home">{t('backHome')}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
