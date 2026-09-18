import ScoreboardTableFilter from '@/features/contest/scoreboard/scoreboard-table-filter';
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
  filter?: string;
};

export default function ContestScoreboard({
  data,
  tid,
  pageType,
  currentUid,
  filter,
}: Props) {
  const t = useTranslations('scoreboard');
  const { tdoc, rows, udict, pdict, availableViews, groups = [] } = data;

  return (
    <div className="space-y-6" data-llm-visible="true">
      <ScoreboardToolbar
        tid={tid}
        pageType={pageType}
        availableViews={availableViews}
        tdoc={tdoc}
      />
      {rows.length > 1 ? (
        <ScoreboardTableFilter
          key={filter}
          rows={rows}
          udict={udict}
          pdict={pdict}
          tid={tid}
          pageType={pageType}
          currentUid={currentUid}
          groups={groups}
          filter={filter}
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
