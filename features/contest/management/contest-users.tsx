'use client';

import ClientApis from '@/api/client/method';
import type { ContestUsersResponse } from '@/api/server/method/contests/management';
import {
  canRemoveContestUser,
  canResumeContestUser,
} from '@/features/contest/management/management-utils';
import UserAutoComplete from '@/features/user/user-auto-complete';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Empty, EmptyDescription } from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Play, Plus, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertDialog, Dialog } from 'radix-ui';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  tid: string;
  data: ContestUsersResponse;
};

export default function ContestUsers({ tid, data }: Props) {
  const t = useTranslations('contestManagement');
  const format = useFormatter();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [uids, setUids] = useState<string[]>([]);
  const [unrank, setUnrank] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const date = (value?: Date) =>
    value
      ? format.dateTime(new Date(value), {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '-';

  const act = async (uid: number, operation: 'rank' | 'resume') => {
    if (busy !== null) return;
    setBusy(uid);
    try {
      const request =
        operation === 'rank'
          ? ClientApis.Contest.toggleContestUserRank(tid, uid)
          : ClientApis.Contest.resumeContestUser(tid, uid);
      await request.send();
      toast.success(
        operation === 'rank' ? t('rankUpdated') : t('contestResumed')
      );
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setBusy(null);
    }
  };

  const add = async () => {
    const ids = uids.map(Number).filter(Number.isFinite);
    if (!ids.length || adding) return;
    setAdding(true);
    try {
      await ClientApis.Contest.addContestUsers(tid, ids, unrank).send();
      toast.success(t('added'));
      setUids([]);
      setUnrank(false);
      setAddOpen(false);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    if (removeTarget === null || busy !== null) return;
    const uid = removeTarget;
    setBusy(uid);
    try {
      await ClientApis.Contest.removeContestUser(tid, uid).send();
      toast.success(t('registrationRemoved'));
      setRemoveTarget(null);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-semibold"
            data-llm-text={t('attendeeManagement')}
          >
            {t('attendeeManagement')}
          </h1>
          <p
            className="mt-1 text-sm text-muted-foreground"
            data-llm-text={t('attendeeCount', { count: data.tsdocs.length })}
          >
            {t('attendeeCount', { count: data.tsdocs.length })}
          </p>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus />
          {t('addAttendees')}
        </Button>
      </div>

      {data.tsdocs.length ? (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">UID</TableHead>
                <TableHead>{t('user')}</TableHead>
                <TableHead className="w-48">{t('begin')}</TableHead>
                <TableHead className="w-48">{t('end')}</TableHead>
                <TableHead className="w-32">{t('rank')}</TableHead>
                <TableHead className="w-48 text-right">
                  {t('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tsdocs.map((status) => {
                const user = data.udict[status.uid];
                const canResume = canResumeContestUser(
                  status,
                  now,
                  data.tdoc.endAt
                );
                const canRemove = canRemoveContestUser(data.tdoc.beginAt, now);

                return (
                  <TableRow key={status.uid}>
                    <TableCell className="font-mono text-muted-foreground">
                      {status.uid}
                    </TableCell>
                    <TableCell>
                      {user ? <UserSpan user={user} /> : status.uid}
                    </TableCell>
                    <TableCell>{date(status.startAt)}</TableCell>
                    <TableCell>{date(status.endAt)}</TableCell>
                    <TableCell>
                      <Badge variant={status.unrank ? 'outline' : 'secondary'}>
                        {status.unrank ? t('unranked') : t('ranked')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          title={
                            status.unrank ? t('markRanked') : t('markUnranked')
                          }
                          onClick={() => void act(status.uid, 'rank')}
                        >
                          {status.unrank ? <ShieldCheck /> : <ShieldOff />}
                          {status.unrank ? t('markRanked') : t('markUnranked')}
                        </Button>
                        {canResume && (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            disabled={busy !== null}
                            title={t('resume')}
                            aria-label={t('resume')}
                            onClick={() => void act(status.uid, 'resume')}
                          >
                            <Play />
                          </Button>
                        )}
                        {canRemove && (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="destructive"
                            disabled={busy !== null}
                            title={t('remove')}
                            aria-label={t('remove')}
                            onClick={() => setRemoveTarget(status.uid)}
                          >
                            <Trash2 />
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
      ) : (
        <Empty className="min-h-48 border">
          <EmptyDescription>{t('noAttendees')}</EmptyDescription>
        </Empty>
      )}

      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <Dialog.Content
            className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-5 outline-none"
            data-llm-visible="true"
          >
            <Dialog.Title
              className="text-lg font-semibold"
              data-llm-text={t('addAttendees')}
            >
              {t('addAttendees')}
            </Dialog.Title>
            <Dialog.Description
              className="mt-1 text-sm text-muted-foreground"
              data-llm-text={t('addAttendeesDescription')}
            >
              {t('addAttendeesDescription')}
            </Dialog.Description>
            <div className="mt-5 space-y-4">
              <UserAutoComplete
                domainId={data.tdoc.domainId}
                multiple
                value={uids}
                onValueChange={setUids}
                placeholder={t('searchUsers')}
                ariaLabel={t('searchUsers')}
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={unrank}
                  onCheckedChange={(value) => setUnrank(Boolean(value))}
                />
                <span>{t('unrank')}</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={adding}>
                  {t('cancel')}
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                disabled={!uids.length || adding}
                onClick={() => void add()}
              >
                {adding ? t('adding') : t('add')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && busy === null) setRemoveTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content className="bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-5 outline-none">
            <AlertDialog.Title className="text-lg font-semibold">
              {t('removeAttendeeTitle')}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              {t('removeAttendeeDescription')}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy !== null}
                >
                  {t('cancel')}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy !== null}
                  onClick={() => void remove()}
                >
                  {t('remove')}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
