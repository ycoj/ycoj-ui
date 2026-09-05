import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

function InfoRow({
  label,
  value,
  llmText,
}: {
  label: string;
  value: ReactNode;
  llmText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums" data-llm-text={llmText}>
        {value}
      </span>
    </div>
  );
}

type Props = {
  paperId: string;
  data: PreliminaryDetailData;
};

export default function PreliminaryPaperMeta({ paperId, data }: Props) {
  const t = useTranslations('preliminary');
  const paper = data.paper;
  const owner = data.owner;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-sm font-medium" data-llm-text={t('information')}>
          {t('information')}
        </h2>
        <InfoRow
          label={t('questions')}
          value={paper.questionCount}
          llmText={String(paper.questionCount)}
        />
        <InfoRow
          label={t('points')}
          value={paper.totalScore}
          llmText={String(paper.totalScore)}
        />
        <InfoRow
          label={t('revision')}
          value={paper.revision}
          llmText={String(paper.revision)}
        />
        <InfoRow
          label={t('attempts')}
          value={paper.nAttempt}
          llmText={String(paper.nAttempt)}
        />
        <InfoRow
          label={t('creator')}
          value={owner ? <UserSpan user={owner} /> : '-'}
          llmText={owner?.uname}
        />
      </div>

      {data.attempts.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-sm font-medium" data-llm-text={t('myAttempts')}>
              {t('myAttempts')}
            </h2>
            <div className="space-y-1">
              {data.attempts.map((attempt) => (
                <Button
                  key={attempt.docId}
                  asChild
                  variant="ghost"
                  className="h-auto min-h-11 w-full justify-start md:min-h-0 px-2 py-1.5"
                >
                  <Link
                    href={`/preliminary/${paperId}/attempt/${attempt.docId}`}
                  >
                    <span className="tabular-nums">
                      <strong>
                        {attempt.score} / {attempt.totalScore}
                      </strong>
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
