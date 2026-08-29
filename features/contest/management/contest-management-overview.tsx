'use client';

import ClientApis from '@/api/client/method';
import type { ContestManagementResponse } from '@/api/server/method/contests/management';
import ContestFilesManager from '@/features/contest/management/contest-files-manager';
import { validateContestScore } from '@/features/contest/management/management-utils';
import ProblemTitle from '@/features/problem/detail/problem-title';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  tid: string;
  data: ContestManagementResponse;
};

export default function ContestManagementOverview({ tid, data }: Props) {
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

  return (
    <div className="space-y-8" data-llm-visible="true">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold" data-llm-text={t('scores')}>
          {t('scores')}
        </h1>
        <div className="overflow-hidden rounded-xl border">
          <Table className="table-fixed">
            <colgroup>
              <col />
              <col className="w-36" />
              <col className="w-28" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>{t('problem')}</TableHead>
                <TableHead>{t('score')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tdoc.pids.map((pid) => {
                const problem = data.pdict[pid];
                return (
                  <TableRow key={pid}>
                    <TableCell>
                      {problem ? (
                        <ProblemTitle problem={problem} compact />
                      ) : (
                        <span data-llm-text={`#${pid}`}>#{pid}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={scores[pid]}
                        aria-label={t('scoreForProblem', {
                          problem: problem?.title ?? `#${pid}`,
                        })}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [pid]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') void save(pid);
                        }}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={busy === pid}
                        onClick={() => void save(pid)}
                      >
                        {busy === pid ? t('saving') : t('save')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <ContestFilesManager
        tid={tid}
        files={data.files ?? []}
        privateFiles={data.privateFiles ?? []}
      />
    </div>
  );
}
