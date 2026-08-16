'use client';

import { AiGenerationHeader } from './ai-generation-header';
import {
  fallbackStage,
  getReport,
  getValue,
  TERMINAL_STAGES,
  TERMINAL_STATUSES,
} from './ai-generation-helpers';
import { AiGenerationReport } from './ai-generation-report';
import { AiGenerationTimeline } from './ai-generation-timeline';
import { parseAiTraceEvents } from './ai-generation-trace';
import type { AiGenerationProps } from './ai-generation-types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function AiGenerationLog({
  rdoc,
  pdoc,
  udoc,
  allowCancel,
  onCancel,
}: AiGenerationProps) {
  const t = useTranslations('record');
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const events = parseAiTraceEvents(rdoc.testCases ?? []);
  const meta = rdoc.aiGeneration;
  const stage = meta?.stage ?? fallbackStage(rdoc.status);
  const progress = Math.min(100, Math.max(0, rdoc.progress ?? 0));
  const terminal =
    TERMINAL_STATUSES.has(rdoc.status) || TERMINAL_STAGES.has(stage);
  const report = getReport(events);
  const generationEvent = [...events]
    .reverse()
    .find(
      ({ parsed }) =>
        parsed.kind === 'trace' && parsed.trace.type === 'generation'
    );
  const generationData =
    generationEvent?.parsed.kind === 'trace'
      ? generationEvent.parsed.trace.data
      : undefined;
  const caseCount = generationData
    ? getValue(generationData, 'caseCount')
    : null;
  const totalBytes = generationData
    ? getValue(generationData, 'totalBytes')
    : null;

  const handleCancel = async () => {
    if (cancelPending) return;
    setCancelPending(true);
    setCancelError('');
    try {
      await onCancel();
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : String(error));
    } finally {
      setCancelPending(false);
    }
  };

  return (
    <section className="space-y-6" data-llm-visible="true">
      <AiGenerationHeader
        pdoc={pdoc}
        udoc={udoc}
        rdoc={rdoc}
        stage={stage}
        progress={progress}
        terminal={terminal}
        allowCancel={allowCancel}
        cancelPending={cancelPending}
        cancelError={cancelError}
        onCancelClick={() => void handleCancel()}
      />

      {rdoc.code && (
        <section className="space-y-2">
          <h2
            className="font-medium"
            data-llm-text={t('aiGeneration.instructions')}
          >
            {t('aiGeneration.instructions')}
          </h2>
          <pre className="bg-muted/50 overflow-x-auto rounded-lg p-4 text-sm whitespace-pre-wrap">
            {rdoc.code}
          </pre>
        </section>
      )}

      {report && (
        <AiGenerationReport
          report={report}
          caseCount={caseCount}
          totalBytes={totalBytes}
        />
      )}

      <AiGenerationTimeline events={events} />
    </section>
  );
}
