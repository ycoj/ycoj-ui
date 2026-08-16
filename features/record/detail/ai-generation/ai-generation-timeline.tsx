import { getValue } from './ai-generation-helpers';
import { ToolIcon, TraceIcon } from './ai-generation-icons';
import type { AiTraceEvent } from './ai-generation-trace';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { STATUS_BACKGROUND_COLOR } from '@/shared/configs/status';
import { formatTime } from '@/shared/lib/format-units';
import type { AiTraceEventType, AiTraceMessage } from '@/shared/types/record';
import { useTranslations } from 'next-intl';

const EVENT_LABEL_KEYS: Record<
  Exclude<AiTraceEventType, 'tool'>,
  'generation' | 'preparation' | 'agentTurn' | 'validation' | 'replacement'
> = {
  generation: 'generation',
  preparation: 'preparation',
  agent_turn: 'agentTurn',
  validation: 'validation',
  replacement: 'replacement',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getToolDetail(
  data: Record<string, unknown>,
  key: string
): string | null {
  const details = data.details;
  return isRecord(details) ? getValue(details, key) : null;
}

function ToolEventRow({ trace }: { trace: AiTraceMessage }) {
  const t = useTranslations('record.aiGeneration');
  const tool = getValue(trace.data, 'tool');
  const normalizedTool = tool?.toLowerCase();
  const running = trace.state === 'running';
  const summary = getValue(trace.data, 'summary');

  if (normalizedTool === 'read' || normalizedTool === 'edit') {
    const path = getToolDetail(trace.data, 'path') ?? summary;
    let action: string;
    if (normalizedTool === 'read') {
      action = running ? t('tools.reading') : t('tools.read');
    } else {
      action = running ? t('tools.editing') : t('tools.edited');
    }
    const text = path
      ? t(normalizedTool === 'read' ? 'tools.readFile' : 'tools.editFile', {
          action,
          path,
        })
      : action;

    return (
      <li
        className="flex min-w-0 items-center gap-2 py-2 text-sm"
        aria-label={text}
        data-llm-text={text}
      >
        <span className="text-muted-foreground shrink-0">
          <ToolIcon
            tool={tool}
            running={running}
            runningLabel={t('states.running')}
          />
        </span>
        <span className="min-w-0 font-medium">
          {action}
          {path && (
            <>
              {' '}
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs break-all">
                {path}
              </code>
            </>
          )}
        </span>
      </li>
    );
  }

  if (normalizedTool === 'shell') {
    const command = getToolDetail(trace.data, 'command') ?? summary;
    const action = running ? t('tools.runningCommand') : t('tools.ranCommand');

    if (!command) {
      return (
        <li
          className="flex items-center gap-2 py-2 text-sm font-medium"
          data-llm-text={action}
        >
          <span className="text-muted-foreground shrink-0">
            <ToolIcon
              tool={tool}
              running={running}
              runningLabel={t('states.running')}
            />
          </span>
          {action}
        </li>
      );
    }

    return (
      <li data-llm-visible="true">
        <Accordion type="single" collapsible>
          <AccordionItem value={`shell-${trace.seq}`} className="border-0">
            <AccordionTrigger
              aria-label={action}
              className="cursor-pointer gap-3 py-2 hover:no-underline"
              data-llm-text={action}
            >
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0">
                  <ToolIcon
                    tool={tool}
                    running={running}
                    runningLabel={t('states.running')}
                  />
                </span>
                {action}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2 pl-6">
              <pre className="bg-muted/50 overflow-x-auto rounded-md border p-3 text-xs whitespace-pre-wrap">
                <code data-llm-text={command}>{command}</code>
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </li>
    );
  }

  const label = tool ?? t('tools.call');
  return (
    <li
      className="flex items-center gap-2 py-2 text-sm font-medium"
      data-llm-text={label}
    >
      <span className="text-muted-foreground shrink-0">
        <ToolIcon
          tool={tool}
          running={running}
          runningLabel={t('states.running')}
        />
      </span>
      {label}
    </li>
  );
}

export function TraceEventRow({ event }: { event: AiTraceEvent }) {
  const t = useTranslations('record.aiGeneration');
  const { testcase, parsed } = event;
  const color = STATUS_BACKGROUND_COLOR[testcase.status] ?? '#6b7280';

  if (parsed.kind === 'text') {
    return (
      <li className="py-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            #{testcase.id}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {formatTime(testcase.time, 'ms')}
          </span>
        </div>
        <pre
          className="text-muted-foreground mt-2 overflow-x-auto whitespace-pre-wrap pl-4 text-sm"
          data-llm-text={parsed.text}
        >
          {parsed.text}
        </pre>
      </li>
    );
  }

  const { trace } = parsed;
  if (trace.type === 'tool') return <ToolEventRow trace={trace} />;

  const label = t(`events.${EVENT_LABEL_KEYS[trace.type]}`);
  return (
    <li
      className="flex items-center gap-2 py-2 text-sm font-medium"
      data-llm-text={label}
    >
      <span className="text-muted-foreground shrink-0">
        <TraceIcon
          state={trace.state}
          runningLabel={t('states.running')}
          completedLabel={t('states.completed')}
        />
      </span>
      {label}
    </li>
  );
}

export function AiGenerationTimeline({ events }: { events: AiTraceEvent[] }) {
  const t = useTranslations('record.aiGeneration');

  return (
    <section className="space-y-3" data-llm-visible="true">
      <h2 className="font-medium" data-llm-text={t('timeline')}>
        {t('timeline')}
      </h2>
      {events.length > 0 ? (
        <ul>
          {events.map((event) => (
            <TraceEventRow key={event.testcase.id} event={event} />
          ))}
        </ul>
      ) : (
        <p
          className="text-muted-foreground text-sm"
          data-llm-text={t('noEvents')}
        >
          {t('noEvents')}
        </p>
      )}
    </section>
  );
}
