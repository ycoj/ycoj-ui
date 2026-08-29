'use client';

import {
  serializeBalloonConfig,
  validateContestScore,
  canRemoveContestUser,
  canResumeContestUser,
  getClarificationSubject,
  normalizeBulkResult,
  normalizeZipMode,
} from './management-utils';
import ClientApis from '@/api/client/method';
import type { ContestBulkSubmitResult } from '@/api/client/method/contest/bulk-submit';
import type { ContestBulkSubmitResponse } from '@/api/server/method/contests/bulk-submit';
import type {
  ContestBalloonsResponse,
  ContestClarificationResponse,
  ContestManagementResponse,
  ContestUsersResponse,
} from '@/api/server/method/contests/management';
import UserAutoComplete from '@/features/user/user-auto-complete';
import Markdown from '@/shared/components/markdown';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type ContestManagementClientProps =
  | { mode: 'management'; tid: string; data: ContestManagementResponse }
  | { mode: 'user'; tid: string; data: ContestUsersResponse }
  | {
      mode: 'clarification';
      tid: string;
      data: ContestClarificationResponse;
    }
  | { mode: 'balloon'; tid: string; data: ContestBalloonsResponse }
  | { mode: 'bulk-submit'; tid: string; data: ContestBulkSubmitResponse };

function FileList({
  tid,
  files,
  type,
  onRefresh,
}: {
  tid: string;
  files: ContestManagementResponse['files'];
  type: 'public' | 'private';
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const t = useTranslations('contestManagement');
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  const remove = async () => {
    if (!selected.length || !window.confirm(t('confirmDelete'))) return;
    setBusy(true);
    try {
      await ClientApis.Contest.deleteContestFiles(tid, selected, type).send();
      toast.success(t('deleted'));
      setSelected([]);
      onRefresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await ClientApis.Contest.uploadContestFile(tid, file, type).send();
      toast.success(t('uploaded'));
      onRefresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {type === 'public' ? t('publicFiles') : t('privateFiles')}
        </h3>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button asChild size="sm">
              <span>
                {t('upload')}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </span>
            </Button>
          </label>
          <Button
            size="sm"
            variant="destructive"
            disabled={!selected.length || busy}
            onClick={remove}
          >
            {t('delete')}
          </Button>
        </div>
      </div>
      {files.length ? (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file._id}
              className="flex items-center gap-2 rounded border p-2"
            >
              <Checkbox
                checked={selected.includes(file._id)}
                onCheckedChange={() => toggle(file._id)}
              />
              <a
                className="flex-1 underline"
                href={`/api/contest/${encodeURIComponent(tid)}/file/${type}/${encodeURIComponent(file.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {file.name}
              </a>
              <span className="text-muted-foreground text-xs">
                {file.size} B
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t('noFiles')}</p>
      )}
    </section>
  );
}

function Management({
  tid,
  data,
}: {
  tid: string;
  data: ContestManagementResponse;
}) {
  const router = useRouter();
  const t = useTranslations('contestManagement');
  const [scores, setScores] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      data.tdoc.pids.map((pid) => [pid, String(data.tdoc.score?.[pid] ?? 100)])
    )
  );
  const [busy, setBusy] = useState<number | null>(null);
  const save = async (pid: number) => {
    const score = Number(scores[pid]);
    if (!validateContestScore(score)) {
      toast.error(t('invalidScore'));
      return;
    }
    setBusy(pid);
    try {
      await ClientApis.Contest.setContestProblemScore(tid, pid, score).send();
      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setBusy(null);
    }
  };
  const refresh = () => router.refresh();
  return (
    <div className="space-y-6" data-llm-visible="true">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('scores')}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('problem')}</TableHead>
              <TableHead>{t('score')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.tdoc.pids.map((pid) => (
              <TableRow key={pid}>
                <TableCell>{data.pdict[pid]?.title || `#${pid}`}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={scores[pid]}
                    onChange={(e) =>
                      setScores((s) => ({ ...s, [pid]: e.target.value }))
                    }
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    disabled={busy === pid}
                    onClick={() => save(pid)}
                  >
                    {t('save')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <FileList
        tid={tid}
        files={data.files ?? []}
        type="public"
        onRefresh={refresh}
      />
      <FileList
        tid={tid}
        files={data.privateFiles ?? []}
        type="private"
        onRefresh={refresh}
      />
    </div>
  );
}

function Users({ tid, data }: { tid: string; data: ContestUsersResponse }) {
  const t = useTranslations('contestManagement');
  const router = useRouter();
  const [uids, setUids] = useState<string[]>([]);
  const [unrank, setUnrank] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const nowRef = useRef(now);
  useEffect(() => {
    const updateNow = () => {
      nowRef.current = Date.now();
    };
    const timer = window.setInterval(updateNow, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const act = async (
    uid: number,
    operation: 'rank' | 'resume' | 'remove_user'
  ) => {
    if (
      operation === 'resume' &&
      !canResumeContestUser(
        data.tsdocs.find((status) => status.uid === uid) ?? {},
        nowRef.current,
        data.tdoc.endAt
      )
    ) {
      return;
    }
    if (!window.confirm(t('confirmAction'))) return;
    setBusy(uid);
    try {
      const api =
        operation === 'rank'
          ? ClientApis.Contest.toggleContestUserRank
          : operation === 'resume'
            ? ClientApis.Contest.resumeContestUser
            : ClientApis.Contest.removeContestUser;
      await api(tid, uid).send();
      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setBusy(null);
    }
  };
  const add = async () => {
    const ids = uids.map(Number).filter(Number.isFinite);
    if (!ids.length) return;
    try {
      await ClientApis.Contest.addContestUsers(tid, ids, unrank).send();
      toast.success(t('added'));
      setUids([]);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    }
  };
  return (
    <div className="space-y-5" data-llm-visible="true">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('addAttendees')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <UserAutoComplete
            domainId={data.tdoc.domainId}
            multiple
            value={uids}
            onValueChange={setUids}
            className="min-w-64 flex-1"
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={unrank}
              onCheckedChange={(v) => setUnrank(Boolean(v))}
            />
            {t('unrank')}
          </label>
          <Button onClick={add}>{t('add')}</Button>
        </div>
      </section>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>UID</TableHead>
            <TableHead>{t('user')}</TableHead>
            <TableHead>{t('begin')}</TableHead>
            <TableHead>{t('end')}</TableHead>
            <TableHead>{t('rank')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.tsdocs.map((s) => {
            const u = data.udict[s.uid];
            const userEnded = Boolean(
              s.endAt && new Date(s.endAt).getTime() < now
            );
            const canResume = canResumeContestUser(s, now, data.tdoc.endAt);
            return (
              <TableRow key={s.uid}>
                <TableCell>{s.uid}</TableCell>
                <TableCell>{u?.uname ?? s.uid}</TableCell>
                <TableCell>
                  {s.startAt ? new Date(s.startAt).toLocaleString() : '-'}
                </TableCell>
                <TableCell>
                  {s.endAt ? new Date(s.endAt).toLocaleString() : '-'}
                </TableCell>
                <TableCell>
                  {s.unrank ? (
                    <Badge variant="outline">{t('unranked')}</Badge>
                  ) : (
                    <Badge>{t('ranked')}</Badge>
                  )}
                </TableCell>
                <TableCell className="flex gap-1">
                  {!userEnded && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === s.uid}
                      onClick={() => act(s.uid, 'rank')}
                    >
                      {t('toggleRank')}
                    </Button>
                  )}
                  {canResume && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(s.uid, 'resume')}
                    >
                      {t('resume')}
                    </Button>
                  )}
                  {canRemoveContestUser(data.tdoc.beginAt) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => act(s.uid, 'remove_user')}
                    >
                      {t('remove')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function Clarifications({
  tid,
  data,
}: {
  tid: string;
  data: ContestClarificationResponse;
}) {
  const t = useTranslations('contestManagement');
  const router = useRouter();
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('0');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const submit = async () => {
    if (!content.trim()) return;
    try {
      await ClientApis.Contest.postContestClarification(tid, content, {
        ...(replyTo ? { did: replyTo } : { subject: Number(subject) }),
      }).send();
      toast.success(t('sent'));
      setContent('');
      setReplyTo(null);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    }
  };
  return (
    <div className="space-y-5" data-llm-visible="true">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          {replyTo ? t('reply') : t('broadcast')}
        </h2>
        {!replyTo && (
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('general')}</SelectItem>
              <SelectItem value="-1">{t('technical')}</SelectItem>
              {data.tdoc.pids.map((pid) => (
                <SelectItem key={pid} value={String(pid)}>
                  {data.pdict[pid]?.title || `#${pid}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('messagePlaceholder')}
        />
        <Button onClick={submit}>
          {replyTo ? t('reply') : t('broadcast')}
        </Button>
        {replyTo && (
          <Button variant="ghost" onClick={() => setReplyTo(null)}>
            {t('cancel')}
          </Button>
        )}
      </section>
      {data.tcdocs.length ? (
        data.tcdocs.map((doc) => {
          const subject = getClarificationSubject(
            doc.subject,
            data.pdict[doc.subject]?.title
          );
          return (
            <article key={doc._id} className="space-y-2 border-b pb-4">
              <div className="text-sm font-medium">
                {subject.type === 'problem' ? subject.title : t(subject.type)}
              </div>
              <Markdown>{doc.content}</Markdown>
              {doc.reply?.map((r, i) => (
                <div key={r._id ?? i} className="ml-5 border-l pl-3">
                  <Markdown>{r.content}</Markdown>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplyTo(doc.docId)}
              >
                {t('reply')}
              </Button>
            </article>
          );
        })
      ) : (
        <p className="text-muted-foreground">{t('noClarifications')}</p>
      )}
    </div>
  );
}

function Balloons({
  tid,
  data,
}: {
  tid: string;
  data: ContestBalloonsResponse;
}) {
  const t = useTranslations('contestManagement');
  const router = useRouter();
  const initial = useMemo(
    () =>
      Object.fromEntries(
        data.tdoc.pids.map((pid) => [
          pid,
          data.tdoc.balloon?.[pid] ?? {
            color: '#f59e0b',
            name: data.pdict[pid]?.title ?? `#${pid}`,
          },
        ])
      ),
    [data]
  );
  const [config, setConfig] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setConfig(initial);
  }
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await ClientApis.Contest.setContestBalloonColor(
        tid,
        serializeBalloonConfig(config)
      ).send();
      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setSaving(false);
    }
  };
  const send = async (id: string) => {
    try {
      await ClientApis.Contest.markContestBalloonDone(tid, id).send();
      toast.success(t('sent'));
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    }
  };
  return (
    <div className="space-y-6" data-llm-visible="true">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('balloonConfig')}</h2>
        {data.tdoc.pids.map((pid) => {
          const entry = config[pid] ?? initial[pid];
          if (!entry) return null;
          return (
            <div key={pid} className="flex items-center gap-3">
              <span className="w-16">#{pid}</span>
              <Input
                type="color"
                value={entry.color}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    [pid]: { ...entry, color: e.target.value },
                  }))
                }
                className="h-8 w-14 p-1"
              />
              <Input
                value={entry.name}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    [pid]: { ...entry, name: e.target.value },
                  }))
                }
              />
            </div>
          );
        })}
        <Button disabled={saving} onClick={save}>
          {t('save')}
        </Button>
      </section>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('problem')}</TableHead>
            <TableHead>{t('submitter')}</TableHead>
            <TableHead>{t('award')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('sentBy')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.bdocs.map((b) => (
            <TableRow key={b._id}>
              <TableCell>{data.pdict[b.pid]?.title || `#${b.pid}`}</TableCell>
              <TableCell>{data.udict?.[b.uid]?.uname ?? b.uid}</TableCell>
              <TableCell>{b.first ? t('firstSolve') : '-'}</TableCell>
              <TableCell>{b.sent ? t('sent') : t('pending')}</TableCell>
              <TableCell>
                {b.sent
                  ? `${b.sent}${b.sentAt ? ` · ${new Date(b.sentAt).toLocaleString()}` : ''}`
                  : '-'}
              </TableCell>
              <TableCell>
                {!b.sent && (
                  <Button size="sm" onClick={() => send(b._id)}>
                    {t('send')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BulkSubmit({
  tid,
  data,
}: {
  tid: string;
  data: ContestBulkSubmitResponse;
}) {
  const t = useTranslations('contestManagement');
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState(data.defaultLang);
  const [mode, setMode] = useState<'auto' | 'nested' | 'flat'>('auto');
  const [existing, setExisting] = useState<'vuser' | 'existing'>('existing');
  const [dryrun, setDryrun] = useState(false);
  const [mapping, setMapping] = useState<Record<number, string>>(
    data.mappingDefaults
  );
  const [result, setResult] = useState<ReturnType<
    typeof normalizeBulkResult
  > | null>(null);
  const submit = async () => {
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      toast.error(t('zipOnly'));
      return;
    }
    try {
      const raw = await ClientApis.Contest.submitContestBulk(tid, file, {
        lang,
        zipMode: normalizeZipMode(mode),
        existingUser: existing,
        dryrun,
        mapping,
      }).send();
      setResult(normalizeBulkResult(raw as ContestBulkSubmitResult));
    } catch {
      toast.error(t('actionFailed'));
    }
  };
  return (
    <div className="space-y-5" data-llm-visible="true">
      <div className="space-y-3">
        <div
          className="rounded-lg border border-dashed p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <p className="text-muted-foreground mb-2 text-sm">
            {file?.name ?? t('zipOnly')}
          </p>
          <Input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            value={mode}
            onValueChange={(v) => setMode(normalizeZipMode(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t('modeAuto')}</SelectItem>
              <SelectItem value="nested">{t('modeNested')}</SelectItem>
              <SelectItem value="flat">{t('modeFlat')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex w-full flex-wrap gap-2">
            {data.tdoc.pids.map((pid) => (
              <label key={pid} className="flex items-center gap-1 text-sm">
                #{pid}
                <Input
                  className="w-28"
                  value={mapping[pid] ?? ''}
                  onChange={(e) =>
                    setMapping((current) => ({
                      ...current,
                      [pid]: e.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(data.langRange).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={existing}
            onValueChange={(v) => setExisting(v as 'vuser' | 'existing')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="existing">{t('existingUsers')}</SelectItem>
              <SelectItem value="vuser">{t('createUsers')}</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={dryrun}
              onCheckedChange={(v) => setDryrun(Boolean(v))}
            />
            {t('dryRun')}
          </label>
          <Button onClick={submit}>{t('submit')}</Button>
        </div>
      </div>
      {result && (
        <div className="space-y-4">
          <Badge>{result.dryrun ? t('dryRun') : t('submitted')}</Badge>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('user')}</TableHead>
                <TableHead>{t('problem')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.submitted.map((s, i) => (
                <TableRow key={`s${i}`}>
                  <TableCell>{s.uname}</TableCell>
                  <TableCell>{s.pid}</TableCell>
                  <TableCell>{t('submitted')}</TableCell>
                </TableRow>
              ))}
              {result.skipped.map((s, i) => (
                <TableRow key={`k${i}`}>
                  <TableCell>{s.uname}</TableCell>
                  <TableCell>{s.problem}</TableCell>
                  <TableCell>{s.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function ContestManagementClient(
  props: ContestManagementClientProps
) {
  switch (props.mode) {
    case 'management':
      return <Management tid={props.tid} data={props.data} />;
    case 'user':
      return <Users tid={props.tid} data={props.data} />;
    case 'clarification':
      return <Clarifications tid={props.tid} data={props.data} />;
    case 'balloon':
      return <Balloons tid={props.tid} data={props.data} />;
    case 'bulk-submit':
      return <BulkSubmit tid={props.tid} data={props.data} />;
  }
}
