'use client';

import ClientApis from '@/api/client/method';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Label } from '@/shared/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Textarea } from '@/shared/components/ui/textarea';
import type {
  RealnameApplication,
  RealnameManageData,
  ReviewRealnameRequest,
} from '@/shared/types/realname';
import {
  Ban,
  Check,
  CircleAlert,
  FileCheck2,
  LoaderCircle,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  data: RealnameManageData;
};

type ReviewAction = ReviewRealnameRequest['operation'];

type PendingReview = {
  application: RealnameApplication;
  action: ReviewAction;
};

export default function RealnameReviewList({ data }: Props) {
  const t = useTranslations('realname.manage');
  const locale = useLocale();
  const router = useRouter();
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(
    null
  );
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  };
  const openReview = (
    application: RealnameApplication,
    action: ReviewAction
  ) => {
    setReason('');
    setPendingReview({ application, action });
  };
  const submitReview = async () => {
    if (!pendingReview || submitting) return;
    setSubmitting(true);

    try {
      const payload: ReviewRealnameRequest =
        pendingReview.action === 'approve'
          ? {
              operation: 'approve',
              id: pendingReview.application._id,
            }
          : {
              operation: pendingReview.action,
              id: pendingReview.application._id,
              reason: reason.trim(),
            };
      await ClientApis.Realname.reviewRealname(payload).send();
      toast.success(t(`success.${pendingReview.action}`));
      setPendingReview(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t('actionFailed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!data.rdocs.length) {
    return (
      <Empty className="min-h-56 border" data-llm-visible="true">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCheck2 />
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
    <>
      <div className="rounded-lg border" data-llm-visible="true">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('user')}</TableHead>
              <TableHead>{t('realName')}</TableHead>
              <TableHead>{t('school')}</TableHead>
              <TableHead>{t('statusLabel')}</TableHead>
              <TableHead>{t('submittedAt')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rdocs.map((application) => {
              const user = data.udict[application.uid];
              return (
                <TableRow key={application._id}>
                  <TableCell>
                    {user ? <UserSpan user={user} /> : `UID ${application.uid}`}
                  </TableCell>
                  <TableCell data-llm-text={application.realName}>
                    {application.realName}
                  </TableCell>
                  <TableCell
                    className="max-w-64 whitespace-normal"
                    data-llm-text={application.school}
                  >
                    {application.school}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={
                          application.status === 'approved'
                            ? 'default'
                            : application.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {t(`status.${application.status}`)}
                      </Badge>
                      {application.status === 'rejected' &&
                        application.rejectReason && (
                          <p
                            className="max-w-56 text-xs text-muted-foreground whitespace-normal"
                            data-llm-text={application.rejectReason}
                          >
                            {application.rejectReason}
                          </p>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(application.submittedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {application.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openReview(application, 'approve')}
                          >
                            <Check />
                            {t('approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openReview(application, 'reject')}
                          >
                            <X />
                            {t('reject')}
                          </Button>
                        </>
                      )}
                      {application.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReview(application, 'revoke')}
                        >
                          <Ban />
                          {t('revoke')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog.Root
        open={!!pendingReview}
        onOpenChange={(open) => {
          if (!open && !submitting) setPendingReview(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-5 shadow-lg"
            data-llm-visible="true"
          >
            {pendingReview && (
              <>
                <Dialog.Title
                  className="text-lg font-semibold"
                  data-llm-text={t(`dialog.${pendingReview.action}Title`)}
                >
                  {t(`dialog.${pendingReview.action}Title`)}
                </Dialog.Title>
                <Dialog.Description
                  className="mt-2 text-sm text-muted-foreground"
                  data-llm-text={t(
                    `dialog.${pendingReview.action}Description`,
                    {
                      name: pendingReview.application.realName,
                    }
                  )}
                >
                  {t(`dialog.${pendingReview.action}Description`, {
                    name: pendingReview.application.realName,
                  })}
                </Dialog.Description>
                {pendingReview.action !== 'approve' && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="realname-review-reason">
                      {t('dialog.reason')}
                    </Label>
                    <Textarea
                      id="realname-review-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={t('dialog.reasonPlaceholder')}
                      disabled={submitting}
                      maxLength={500}
                    />
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submitting}
                    >
                      {t('cancel')}
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="button"
                    variant={
                      pendingReview.action === 'approve'
                        ? 'default'
                        : 'destructive'
                    }
                    onClick={submitReview}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <LoaderCircle className="animate-spin" />
                    ) : pendingReview.action === 'approve' ? (
                      <Check />
                    ) : (
                      <CircleAlert />
                    )}
                    {submitting
                      ? t('submitting')
                      : t(`dialog.confirm.${pendingReview.action}`)}
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
