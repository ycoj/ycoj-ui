'use client';

import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import PreliminaryEditActions from '@/features/preliminary/detail/preliminary-edit-actions';
import PreliminaryNavPanel from '@/features/preliminary/detail/preliminary-nav-panel';
import PreliminaryPaperMeta from '@/features/preliminary/detail/preliminary-paper-meta';
import { getPreliminaryNavQuestions } from '@/features/preliminary/lib/preliminary-utils';
import { Separator } from '@/shared/components/ui/separator';

type Props = {
  paperId: string;
  data: PreliminaryDetailData;
  canEdit: boolean;
};

export default function PreliminarySidebar({ paperId, data, canEdit }: Props) {
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

      <PreliminaryNavPanel questions={navQuestions} />
    </div>
  );
}
