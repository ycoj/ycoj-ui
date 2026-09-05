'use client';

import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryEditActions from '@/features/preliminary/detail/preliminary-edit-actions';
import PreliminaryPaperMeta from '@/features/preliminary/detail/preliminary-paper-meta';
import PreliminaryQuestionNav from '@/features/preliminary/detail/preliminary-question-nav';
import { getPreliminaryNavQuestions } from '@/features/preliminary/lib/preliminary-utils';
import { Separator } from '@/shared/components/ui/separator';
import { useTranslations } from 'next-intl';

type Props = {
  paperId: string;
  data: PreliminaryDetailData;
  canEdit: boolean;
};

export default function PreliminarySidebar({ paperId, data, canEdit }: Props) {
  const t = useTranslations('preliminary');
  const navQuestions = getPreliminaryNavQuestions(data.paper.sections);

  return (
    <div className="w-full space-y-4" data-llm-visible="true">
      {canEdit && (
        <>
          <PreliminaryEditActions paperId={paperId} />
          <Separator />
        </>
      )}

      <PreliminaryPaperMeta paperId={paperId} data={data} />

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
