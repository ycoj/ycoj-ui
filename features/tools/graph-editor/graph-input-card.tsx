'use client';

import type { GraphEditorController } from './use-graph-editor';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { useTranslations } from 'next-intl';

type Props = {
  editor: GraphEditorController;
};

export default function GraphInputCard({ editor }: Props) {
  const t = useTranslations('graphEditor');
  const { text, scheme, skipped, onTextChange } = editor;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('inputTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          spellCheck={false}
          className="min-h-[180px] font-mono text-sm"
          placeholder={t('inputPlaceholder')}
          data-llm-text={text}
        />
        <p className="text-muted-foreground text-xs">
          {scheme === 'custom' ? t('inputHintCustom') : t('inputHintIndexed')}
        </p>
        {skipped > 0 && (
          <p className="text-destructive text-xs">
            {t('skippedLines', { count: skipped })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
