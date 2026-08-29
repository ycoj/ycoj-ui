'use client';

import { Textarea } from '@/shared/components/ui/textarea';
import { AnsiUp } from 'ansi_up';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

type Props = {
  input: string;
  output: string;
  onInputChange: (input: string) => void;
};

export default function ScratchpadPretest({
  input,
  output,
  onInputChange,
}: Props) {
  const t = useTranslations('problem.scratchpad');
  const outputHtml = useMemo(() => new AnsiUp().ansi_to_html(output), [output]);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
      <label className="flex min-h-0 flex-col gap-2 p-3">
        <span className="text-sm font-medium" data-llm-text={t('input')}>
          {t('input')}
        </span>
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          className="min-h-24 flex-1 resize-none font-mono"
          aria-label={t('input')}
        />
      </label>
      <div className="flex min-h-0 flex-col gap-2 p-3">
        <span className="text-sm font-medium" data-llm-text={t('output')}>
          {t('output')}
        </span>
        {output ? (
          <pre
            className="min-h-24 flex-1 overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: outputHtml }}
          />
        ) : (
          <div className="flex min-h-24 flex-1 items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <span data-llm-text={t('noOutput')}>{t('noOutput')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
