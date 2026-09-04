'use client';

import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryQuestionNav from '@/features/preliminary/detail/preliminary-question-nav';
import { getQuestionDisplayNumber } from '@/features/preliminary/lib/preliminary-utils';
import { useDeletePreliminary } from '@/features/preliminary/lib/use-delete-preliminary';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import { Separator } from '@/shared/components/ui/separator';
import type { BaseUser } from '@/shared/types/user';
import { Pencil, Trash, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  paperId: string;
  data: PreliminaryDetailData;
  owner?: BaseUser;
  canEdit: boolean;
};

type SidebarButtonProps = {
  href: string;
  icon: LucideIcon;
  text: string;
};

function SidebarButton({ href, icon: Icon, text }: SidebarButtonProps) {
  return (
    <Button
      asChild
      className="h-10 w-full justify-start gap-3 px-4"
      variant="ghost"
    >
      <Link href={href}>
        <Icon strokeWidth={2} />
        <span data-llm-text={text}>{text}</span>
      </Link>
    </Button>
  );
}

function InfoRow({
  label,
  value,
  llmText,
}: {
  label: string;
  value: React.ReactNode;
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

export default function PreliminarySidebar({
  paperId,
  data,
  owner,
  canEdit,
}: Props) {
  const t = useTranslations('preliminary');
  const common = useTranslations('common');
  const { deleting, deleteError, handleDelete } = useDeletePreliminary(paperId);

  const paper = data.paper;
  const navQuestions = paper.sections.flatMap((section, sectionIndex) => {
    const startIndex = paper.sections
      .slice(0, sectionIndex)
      .reduce((count, prior) => count + prior.questions.length, 0);
    return section.questions.map((question, index) => ({
      id: question.id,
      number: getQuestionDisplayNumber(question, startIndex + index),
    }));
  });

  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      {canEdit && (
        <>
          <div className="space-y-1">
            <SidebarButton
              href={`/preliminary/${paperId}/edit`}
              icon={Pencil}
              text={common('edit')}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="h-10 w-full justify-start gap-3 px-4 text-destructive hover:text-destructive"
            >
              <Trash strokeWidth={2} />
              <span data-llm-text={deleting ? t('deleting') : t('delete')}>
                {deleting ? t('deleting') : t('delete')}
              </span>
            </Button>
            <FieldError
              errors={deleteError ? [{ message: deleteError }] : []}
            />
          </div>
          <Separator />
        </>
      )}

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
                  className="h-auto w-full justify-start px-2 py-1.5"
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

      <Separator />

      <div className="space-y-3">
        <h2 className="text-sm font-medium" data-llm-text={t('directory')}>
          {t('directory')}
        </h2>
        <PreliminaryQuestionNav questions={navQuestions} />
      </div>
    </div>
  );
}
