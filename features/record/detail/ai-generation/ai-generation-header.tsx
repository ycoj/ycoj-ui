import { formatDate } from './ai-generation-helpers';
import type { AiGenerationHeaderProps } from './ai-generation-types';
import ProblemLink from '@/features/problem/problem-link';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AiGenerationHeader({
  pdoc,
  udoc,
  rdoc,
  stage,
  progress,
  terminal,
  allowCancel,
  cancelPending,
  cancelError,
  onCancelClick,
}: AiGenerationHeaderProps) {
  const t = useTranslations('record');
  const meta = rdoc.aiGeneration;

  return (
    <header className="space-y-5 border-b pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1
            className="text-xl font-semibold"
            data-llm-text={t('aiGeneration.pageTitle', { title: pdoc.title })}
          >
            {t('aiGeneration.pageTitle', { title: pdoc.title })}
          </h1>
          <UserSpan user={udoc} showAvatar />
        </div>
        {allowCancel && !terminal && (
          <Button
            type="button"
            variant="outline"
            disabled={cancelPending}
            onClick={onCancelClick}
          >
            <Ban />
            {cancelPending
              ? t('aiGeneration.cancelling')
              : t('aiGeneration.cancel')}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span
            className="font-medium"
            data-llm-text={t(`aiGeneration.stages.${stage}`)}
          >
            {t(`aiGeneration.stages.${stage}`)}
          </span>
          <span
            className="text-muted-foreground tabular-nums"
            data-llm-text={`${progress}%`}
          >
            {progress}%
          </span>
        </div>
        <Progress
          value={progress}
          aria-label={t('aiGeneration.progress')}
          className="h-2"
        />
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">{t('aiGeneration.model')}</dt>
          <dd className="font-mono" data-llm-text={meta?.model ?? '-'}>
            {meta?.model ?? '-'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('aiGeneration.testcaseTarget')}
          </dt>
          <dd data-llm-text={String(meta?.testcaseTarget ?? '-')}>
            {meta?.testcaseTarget ?? '-'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('aiGeneration.testcaseCount')}
          </dt>
          <dd data-llm-text={String(meta?.testcaseCount ?? '-')}>
            {meta?.testcaseCount ?? '-'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('aiGeneration.judgeLimits')}
          </dt>
          <dd
            data-llm-text={
              meta?.timeLimitMs && meta?.memoryLimitMb
                ? `${meta.timeLimitMs} ms / ${meta.memoryLimitMb} MiB`
                : '-'
            }
          >
            {meta?.timeLimitMs && meta?.memoryLimitMb
              ? `${meta.timeLimitMs} ms / ${meta.memoryLimitMb} MiB`
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('aiGeneration.checker')}</dt>
          <dd
            data-llm-text={t(
              `aiGeneration.checkerModes.${meta?.checkerMode ?? 'default'}`
            )}
          >
            {t(`aiGeneration.checkerModes.${meta?.checkerMode ?? 'default'}`)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('aiGeneration.startedAt')}
          </dt>
          <dd data-llm-text={formatDate(meta?.startedAt)}>
            {formatDate(meta?.startedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('aiGeneration.finishedAt')}
          </dt>
          <dd data-llm-text={formatDate(meta?.finishedAt)}>
            {formatDate(meta?.finishedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('aiGeneration.recordId')}
          </dt>
          <dd className="truncate font-mono" data-llm-text={rdoc._id}>
            {rdoc._id}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('aiGeneration.problem')}</dt>
          <dd>
            <ProblemLink problem={pdoc} />
          </dd>
        </div>
      </dl>
      {cancelError && (
        <p
          className="text-destructive text-sm"
          role="alert"
          data-llm-text={cancelError}
        >
          {cancelError}
        </p>
      )}
    </header>
  );
}
