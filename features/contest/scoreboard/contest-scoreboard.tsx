import ScoreboardTable from '@/features/contest/scoreboard/scoreboard-table';
import ScoreboardToolbar from '@/features/contest/scoreboard/scoreboard-toolbar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import type { ScoreboardResponse } from '@/shared/types/contest';
import { Clipboard } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  data: ScoreboardResponse;
  tid: string;
  pageType: 'contest' | 'homework';
  currentUid?: number;
};

export default function ContestScoreboard({
  data,
  tid,
  pageType,
  currentUid,
}: Props) {
  const t = useTranslations('scoreboard');
  const { tdoc, rows, udict, pdict, availableViews } = data;

  return (
    <div className="space-y-6" data-llm-visible="true">
      <ScoreboardToolbar
        tid={tid}
        pageType={pageType}
        availableViews={availableViews}
        tdoc={tdoc}
      />
      {rows.length > 1 ? (
        <ScoreboardTable
          rows={rows}
          udict={udict}
          pdict={pdict}
          tid={tid}
          pageType={pageType}
          currentUid={currentUid}
        />
      ) : (
        <Empty data-llm-visible="true">
          <EmptyMedia variant="icon">
            <Clipboard strokeWidth={2} />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle data-llm-text={t('noData')}>{t('noData')}</EmptyTitle>
            <EmptyDescription data-llm-text={t('noSubmissions')}>
              {t('noSubmissions')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
