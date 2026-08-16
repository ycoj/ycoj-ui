import type { AiGenerationReportProps } from './ai-generation-types';
import { formatMemory } from '@/shared/lib/format-units';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AiGenerationReport({
  report,
  caseCount,
  totalBytes,
}: AiGenerationReportProps) {
  const t = useTranslations('record');

  return (
    <section className="space-y-2">
      <h2 className="font-medium" data-llm-text={t('aiGeneration.report')}>
        {t('aiGeneration.report')}
      </h2>
      <div
        className="prose prose-sm dark:prose-invert bg-muted/50 max-w-none rounded-lg p-4"
        data-llm-text={report}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
          {report}
        </ReactMarkdown>
      </div>
      {(caseCount || totalBytes) && (
        <p className="text-muted-foreground text-sm">
          {caseCount && t('aiGeneration.caseCount', { count: caseCount })}
          {caseCount && totalBytes && ' · '}
          {totalBytes &&
            t('aiGeneration.totalBytes', {
              size: formatMemory(Number(totalBytes)),
            })}
        </p>
      )}
    </section>
  );
}
