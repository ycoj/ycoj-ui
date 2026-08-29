'use client';

import BulkSubmitTreeView from './bulk-submit-tree-view';
import {
  buildBulkSubmitZipTree,
  normalizeBulkResult,
  normalizeZipMode,
} from './management-utils';
import ClientApis from '@/api/client/method';
import type { ContestBulkSubmitResult } from '@/api/client/method/contest/bulk-submit';
import type { ContestBulkSubmitResponse } from '@/api/server/method/contests/bulk-submit';
import ProblemTitle from '@/features/problem/detail/problem-title';
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
import { FileArchive, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  tid: string;
  data: ContestBulkSubmitResponse;
};

type ZipMode = 'auto' | 'nested' | 'flat';
type ExistingPolicy = 'vuser' | 'existing';

export default function ContestBulkSubmit({ tid, data }: Props) {
  const t = useTranslations('contestManagement');
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState(data.defaultLang);
  const [mode, setMode] = useState<ZipMode>('auto');
  const [existing, setExisting] = useState<ExistingPolicy>('existing');
  const [dryrun, setDryrun] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mapping, setMapping] = useState<Record<number, string>>(
    data.mappingDefaults
  );
  const [result, setResult] = useState<ReturnType<
    typeof normalizeBulkResult
  > | null>(null);
  const zipTree = useMemo(
    () => buildBulkSubmitZipTree(mode, data.tdoc.pids, mapping),
    [data.tdoc.pids, mapping, mode]
  );

  const submit = async () => {
    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      toast.error(t('zipOnly'));
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const raw = await ClientApis.Contest.submitContestBulk(tid, file, {
        lang,
        zipMode: normalizeZipMode(mode),
        existingUser: existing,
        dryrun,
        mapping,
      }).send();
      setResult(normalizeBulkResult(raw as ContestBulkSubmitResult));
      toast.success(dryrun ? t('dryRunCompleted') : t('bulkSubmitCompleted'));
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const modeOptions: Array<{ value: ZipMode; label: string }> = [
    { value: 'auto', label: t('modeAuto') },
    { value: 'nested', label: t('modeNested') },
    { value: 'flat', label: t('modeFlat') },
  ];

  return (
    <div className="space-y-6" data-llm-visible="true">
      <section className="space-y-8">
        <header>
          <h1 className="text-xl font-semibold" data-llm-text={t('bulkSubmit')}>
            {t('bulkSubmit')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('bulkSubmitDescription')}
          </p>
        </header>

        <div className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t('zipLayout')}</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {modeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 py-1 text-sm"
                >
                  <input
                    type="radio"
                    name="zip-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="accent-primary"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {mode === 'auto'
                ? t('modeAutoDescription')
                : mode === 'nested'
                  ? t('modeNestedDescription')
                  : t('modeFlatDescription')}
            </p>
            <BulkSubmitTreeView tree={zipTree} label={t('zipLayout')} />
          </fieldset>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)]">
            <label className="space-y-2 text-sm font-medium">
              <span>{t('zipFile')}</span>
              <div
                className="flex min-h-24 items-center gap-3 rounded-lg border border-dashed px-4 py-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setFile(event.dataTransfer.files?.[0] ?? null);
                }}
              >
                <FileArchive className="size-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-normal">
                    {file?.name ?? t('dropZipHere')}
                  </div>
                  <Input
                    type="file"
                    accept=".zip,application/zip"
                    className="mt-2 h-8"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] ?? null)
                    }
                  />
                </div>
              </div>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>{t('language')}</span>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="w-full">
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
            </label>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <Checkbox
              checked={dryrun}
              onCheckedChange={(value) => setDryrun(Boolean(value))}
            />
            <span>
              <span className="block font-medium">{t('dryRun')}</span>
              <span className="text-muted-foreground">
                {t('dryRunDescription')}
              </span>
            </span>
          </label>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {t('existingUserPolicy')}
            </legend>
            <label className="flex cursor-pointer items-start gap-2 py-1 text-sm">
              <input
                type="radio"
                name="existing-user"
                checked={existing === 'existing'}
                onChange={() => setExisting('existing')}
                className="mt-0.5 accent-primary"
              />
              <span>{t('existingUsersDescription')}</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 py-1 text-sm">
              <input
                type="radio"
                name="existing-user"
                checked={existing === 'vuser'}
                onChange={() => setExisting('vuser')}
                className="mt-0.5 accent-primary"
              />
              <span>{t('createUsersDescription')}</span>
            </label>
          </fieldset>
        </div>

        <div className="overflow-x-auto border-b">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-24" />
              <col />
              <col className="w-60" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>{t('problemId')}</TableHead>
                <TableHead>{t('problem')}</TableHead>
                <TableHead>{t('problemNameInZip')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tdoc.pids.map((pid) => {
                const problem = data.pdict[pid];
                return (
                  <TableRow key={pid}>
                    <TableCell className="font-mono text-muted-foreground">
                      {problem?.docId ?? pid}
                    </TableCell>
                    <TableCell>
                      {problem ? (
                        <ProblemTitle problem={problem} compact />
                      ) : (
                        `#${pid}`
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={mapping[pid] ?? ''}
                        aria-label={t('mappingForProblem', {
                          problem: problem?.title ?? `#${pid}`,
                        })}
                        onChange={(event) =>
                          setMapping((current) => ({
                            ...current,
                            [pid]: event.target.value,
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
        <div>
          <Button
            type="button"
            disabled={!file || submitting}
            onClick={() => void submit()}
          >
            <Upload />
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </div>
      </section>

      {result && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t('result')}</h2>
            <Badge variant={result.dryrun ? 'outline' : 'secondary'}>
              {result.dryrun ? t('dryRun') : t('submitted')}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('bulkResultSummary', {
              users: result.users.length,
              submitted: result.submitted.length,
              skipped: result.skipped.length,
            })}
          </div>
          <div className="overflow-x-auto border-y">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">{t('type')}</TableHead>
                  <TableHead className="w-44">{t('user')}</TableHead>
                  <TableHead className="w-32">{t('problem')}</TableHead>
                  <TableHead>{t('detail')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.users.map((user, index) => (
                  <TableRow key={`u-${user.uid}-${index}`}>
                    <TableCell>{t('user')}</TableCell>
                    <TableCell>{user.uname}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      {user.created ? t('userCreated') : t('userMatched')}
                    </TableCell>
                  </TableRow>
                ))}
                {result.submitted.map((submission, index) => (
                  <TableRow
                    key={`s-${submission.uid}-${submission.pid}-${index}`}
                  >
                    <TableCell>{t('submitted')}</TableCell>
                    <TableCell>{submission.uname}</TableCell>
                    <TableCell>{submission.pid}</TableCell>
                    <TableCell>{submission.rid ?? t('submitted')}</TableCell>
                  </TableRow>
                ))}
                {result.skipped.map((skipped, index) => (
                  <TableRow key={`k-${index}`}>
                    <TableCell>{t('skipped')}</TableCell>
                    <TableCell>{skipped.uname}</TableCell>
                    <TableCell>{skipped.problem}</TableCell>
                    <TableCell>{skipped.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
