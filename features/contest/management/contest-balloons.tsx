'use client';

import { serializeBalloonConfig } from './management-utils';
import ClientApis from '@/api/client/method';
import type { ContestBalloonsResponse } from '@/api/server/method/contests/management';
import {
  getContestProblemLabel,
  getContestStatus,
} from '@/features/contest/detail/contest-utils';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Empty, EmptyDescription } from '@/shared/components/ui/empty';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { CircleCheck, Clock3, Palette, Send } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  tid: string;
  data: ContestBalloonsResponse;
};

export default function ContestBalloons({ tid, data }: Props) {
  const t = useTranslations('contestManagement');
  const format = useFormatter();
  const router = useRouter();
  const initialConfig = useMemo(
    () =>
      Object.fromEntries(
        data.tdoc.pids.map((pid, index) => [
          pid,
          data.tdoc.balloon?.[pid] ?? {
            color: '#f59e0b',
            name:
              data.pdict[pid]?.title ??
              getContestProblemLabel(index) ??
              `#${pid}`,
          },
        ])
      ),
    [data.pdict, data.tdoc.balloon, data.tdoc.pids]
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (getContestStatus(data.tdoc) !== 'running') return;
    const timer = window.setInterval(() => router.refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [data.tdoc, router]);

  const updateConfigOpen = (open: boolean) => {
    if (open) setConfig(initialConfig);
    setConfigOpen(open);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await ClientApis.Contest.setContestBalloonColor(
        tid,
        serializeBalloonConfig(config)
      ).send();
      toast.success(t('saved'));
      setConfigOpen(false);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const send = async (id: string) => {
    if (sendingId) return;
    setSendingId(id);
    try {
      await ClientApis.Contest.markContestBalloonDone(tid, id).send();
      toast.success(t('balloonSent'));
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-4" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" data-llm-text={t('balloons')}>
            {t('balloons')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('balloonDescription')}
          </p>
        </div>
        <Button type="button" onClick={() => updateConfigOpen(true)}>
          <Palette />
          {t('setBalloonConfig')}
        </Button>
      </div>

      {data.tdoc.balloon && Object.keys(data.tdoc.balloon).length ? (
        data.bdocs.length ? (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">{t('status')}</TableHead>
                  <TableHead className="w-24">#</TableHead>
                  <TableHead>{t('problem')}</TableHead>
                  <TableHead className="w-44">{t('submitter')}</TableHead>
                  <TableHead className="w-52">{t('sentBy')}</TableHead>
                  <TableHead className="w-36">{t('award')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bdocs.map((balloon) => {
                  const problemIndex = data.tdoc.pids.indexOf(balloon.pid);
                  const balloonConfig = data.tdoc.balloon?.[balloon.pid];
                  const submitter = data.udict[balloon.uid];
                  const sender = balloon.sent
                    ? data.udict[balloon.sent]
                    : undefined;

                  return (
                    <TableRow key={balloon._id}>
                      <TableCell
                        className={
                          balloon.sent
                            ? 'border-l-4 border-l-emerald-500'
                            : 'border-l-4 border-l-amber-500'
                        }
                      >
                        <Badge
                          variant="outline"
                          className={
                            balloon.sent
                              ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                              : 'border-amber-500/40 text-amber-700 dark:text-amber-400'
                          }
                        >
                          {balloon.sent ? <CircleCheck /> : <Clock3 />}
                          {balloon.sent ? t('sent') : t('pending')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {String(balloon._id).slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="size-3 shrink-0 rounded-full border"
                            style={{ backgroundColor: balloonConfig?.color }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div
                              className="font-medium"
                              style={{ color: balloonConfig?.color }}
                            >
                              {getContestProblemLabel(problemIndex)}.{' '}
                              {balloonConfig?.name ??
                                data.pdict[balloon.pid]?.title ??
                                `#${balloon.pid}`}
                            </div>
                            {!balloon.sent && (
                              <Button
                                type="button"
                                size="sm"
                                variant="link"
                                className="h-auto px-0"
                                disabled={sendingId !== null}
                                onClick={() => void send(balloon._id)}
                              >
                                <Send />
                                {sendingId === balloon._id
                                  ? t('sending')
                                  : t('send')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submitter ? (
                          <UserSpan user={submitter} showAvatar={false} />
                        ) : (
                          balloon.uid
                        )}
                      </TableCell>
                      <TableCell>
                        {balloon.sent ? (
                          <div className="space-y-1">
                            {sender ? (
                              <UserSpan user={sender} showAvatar={false} />
                            ) : (
                              balloon.sent
                            )}
                            {balloon.sentAt && (
                              <div className="text-xs text-muted-foreground">
                                {format.dateTime(new Date(balloon.sentAt), {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {balloon.first ? <Badge>{t('firstSolve')}</Badge> : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="min-h-48 border">
            <EmptyDescription>{t('noBalloons')}</EmptyDescription>
          </Empty>
        )
      ) : (
        <Empty className="min-h-48 border">
          <Palette className="size-8 text-muted-foreground" />
          <EmptyDescription>{t('configureBalloonsFirst')}</EmptyDescription>
          <Button type="button" onClick={() => updateConfigOpen(true)}>
            {t('setBalloonConfig')}
          </Button>
        </Empty>
      )}

      <Dialog.Root open={configOpen} onOpenChange={updateConfigOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="data-open:animate-in data-closed:animate-out fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <Dialog.Content
            className="bg-background data-open:animate-in data-closed:animate-out fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border p-5 outline-none"
            data-llm-visible="true"
          >
            <Dialog.Title className="text-lg font-semibold">
              {t('balloonConfig')}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {t('balloonConfigDescription')}
            </Dialog.Description>
            <div className="mt-5 overflow-hidden rounded-lg border">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-24" />
                  <col className="w-44" />
                  <col />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('problem')}</TableHead>
                    <TableHead>{t('color')}</TableHead>
                    <TableHead>{t('balloonName')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tdoc.pids.map((pid, index) => {
                    const entry = config[pid];
                    if (!entry) return null;
                    return (
                      <TableRow key={pid}>
                        <TableCell className="font-semibold">
                          {getContestProblemLabel(index)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={entry.color}
                              aria-label={t('colorForProblem', {
                                problem: getContestProblemLabel(index),
                              })}
                              onChange={(event) =>
                                setConfig((current) => ({
                                  ...current,
                                  [pid]: {
                                    ...entry,
                                    color: event.target.value,
                                  },
                                }))
                              }
                              className="h-9 w-12 p-1"
                            />
                            <Input
                              value={entry.color}
                              onChange={(event) =>
                                setConfig((current) => ({
                                  ...current,
                                  [pid]: {
                                    ...entry,
                                    color: event.target.value,
                                  },
                                }))
                              }
                              className="w-24 font-mono"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.name}
                            onChange={(event) =>
                              setConfig((current) => ({
                                ...current,
                                [pid]: {
                                  ...entry,
                                  name: event.target.value,
                                },
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  {t('cancel')}
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
