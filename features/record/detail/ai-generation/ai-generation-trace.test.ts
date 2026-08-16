import {
  parseAiTraceEvents,
  parseAiTraceMessage,
} from '@/features/record/detail/ai-generation/ai-generation-trace';
import type { TestCaseResponse } from '@/shared/types/record';
import { describe, expect, it } from 'vitest';

const trace = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    schema: 'hydro.ai-generation.trace',
    version: 1,
    seq: 1,
    type: 'tool',
    state: 'running',
    startedAt: '2026-08-16T12:00:00.000Z',
    data: { tool: 'Read' },
    ...overrides,
  });

const testcase = (id: number, message: string): TestCaseResponse => ({
  id,
  subtaskId: 0,
  score: 0,
  time: 0,
  memory: 0,
  status: 20,
  message,
});

describe('parseAiTraceMessage', () => {
  it('parses a version one trace event', () => {
    const result = parseAiTraceMessage(trace());

    expect(result).toEqual({
      kind: 'trace',
      trace: expect.objectContaining({ seq: 1, type: 'tool' }),
    });
  });

  it('falls back to text for an unknown schema or version', () => {
    expect(parseAiTraceMessage(trace({ schema: 'other' }))).toEqual({
      kind: 'text',
      text: trace({ schema: 'other' }),
    });
    expect(parseAiTraceMessage(trace({ version: 2 }))).toEqual({
      kind: 'text',
      text: trace({ version: 2 }),
    });
  });

  it('falls back to text for an unknown event type or invalid JSON', () => {
    const unknown = trace({ type: 'future_event' });
    expect(parseAiTraceMessage(unknown)).toEqual({
      kind: 'text',
      text: unknown,
    });
    expect(parseAiTraceMessage('not json')).toEqual({
      kind: 'text',
      text: 'not json',
    });
  });

  it('formats structured testcase messages as text', () => {
    expect(
      parseAiTraceMessage({
        message: 'On line {0}: Read {1}, expect {2}.',
        params: [2, '1', '1000000000'],
      })
    ).toEqual({
      kind: 'text',
      text: 'On line 2: Read 1, expect 1000000000.',
    });
  });
});

describe('parseAiTraceEvents', () => {
  it('sorts events by trace sequence and uses testcase ids for fallbacks', () => {
    const events = parseAiTraceEvents([
      testcase(3, trace({ seq: 3 })),
      testcase(1, 'plain text'),
      testcase(2, trace({ seq: 2 })),
    ]);

    expect(events.map(({ testcase: item }) => item.id)).toEqual([1, 2, 3]);
  });
});
