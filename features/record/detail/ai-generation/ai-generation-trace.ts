import { formatTestcaseMessage } from '../format-testcase-message';
import type {
  AiTraceEventType,
  AiTraceMessage,
  AiTraceState,
  TestCaseResponse,
} from '@/shared/types/record';

const TRACE_SCHEMA = 'hydro.ai-generation.trace';
const TRACE_TYPES: AiTraceEventType[] = [
  'generation',
  'preparation',
  'agent_turn',
  'tool',
  'validation',
  'replacement',
];
const TRACE_STATES: AiTraceState[] = [
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'timed_out',
];

export type ParsedAiTrace =
  { kind: 'trace'; trace: AiTraceMessage } | { kind: 'text'; text: string };

export type AiTraceEvent = {
  testcase: TestCaseResponse;
  parsed: ParsedAiTrace;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAiTraceMessage(value: unknown): value is AiTraceMessage {
  if (!isRecord(value)) return false;
  return (
    value.schema === TRACE_SCHEMA &&
    value.version === 1 &&
    typeof value.seq === 'number' &&
    Number.isFinite(value.seq) &&
    typeof value.type === 'string' &&
    TRACE_TYPES.includes(value.type as AiTraceEventType) &&
    typeof value.state === 'string' &&
    TRACE_STATES.includes(value.state as AiTraceState) &&
    typeof value.startedAt === 'string' &&
    (!('finishedAt' in value) || typeof value.finishedAt === 'string') &&
    isRecord(value.data)
  );
}

export function parseAiTraceMessage(
  message: TestCaseResponse['message']
): ParsedAiTrace {
  if (typeof message !== 'string') {
    return { kind: 'text', text: formatTestcaseMessage(message) };
  }

  try {
    const value: unknown = JSON.parse(message);
    if (isAiTraceMessage(value)) return { kind: 'trace', trace: value };
  } catch {
    // Preserve the original message when it is not JSON.
  }
  return { kind: 'text', text: message };
}

export function parseAiTraceEvents(
  testcases: TestCaseResponse[]
): AiTraceEvent[] {
  return testcases
    .map((testcase) => ({
      testcase,
      parsed: parseAiTraceMessage(testcase.message),
    }))
    .sort((a, b) => {
      const aSeq =
        a.parsed.kind === 'trace' ? a.parsed.trace.seq : a.testcase.id;
      const bSeq =
        b.parsed.kind === 'trace' ? b.parsed.trace.seq : b.testcase.id;
      return aSeq - bSeq;
    });
}
