import type { AiTraceEvent } from './ai-generation-trace';
import type { AiGenerationStage } from '@/shared/types/record';
import dayjs from 'dayjs';

export const TERMINAL_STATUSES = new Set([1, 3, 8, 9, 31]);
export const TERMINAL_STAGES = new Set<AiGenerationStage>([
  'completed',
  'failed',
  'cancelled',
]);

export function fallbackStage(status: number): AiGenerationStage {
  if (status === 0) return 'waiting';
  if (status === 1) return 'completed';
  if (status === 9) return 'cancelled';
  if (TERMINAL_STATUSES.has(status)) return 'failed';
  return 'agent';
}

export function getValue(
  data: Record<string, unknown>,
  key: string
): string | null {
  const value = data[key];
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : null;
}

export function parseShellCommandNames(command: string): string[] {
  const names: string[] = [];
  const heredocDelimiters: string[] = [];
  for (const line of command.split('\n')) {
    const trimmed = line.trim();
    if (heredocDelimiters.length > 0) {
      if (trimmed === heredocDelimiters[0]) heredocDelimiters.shift();
      continue;
    }
    for (const match of trimmed.matchAll(
      /<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/g
    )) {
      heredocDelimiters.push(match[1]);
    }
    for (const segment of trimmed.split(/(?:\|\||&&|[|;])/)) {
      const token = segment
        .trim()
        .split(/\s+/)
        .find((part) => part && !/^[A-Za-z_][A-Za-z0-9_]*=/.test(part))
        ?.replace(/^\(+/, '');
      if (!token) continue;
      const name = token.split('/').pop();
      if (name && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

export function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatDate(value?: string): string {
  const date = value ? dayjs(value) : null;
  return date?.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function getReport(events: AiTraceEvent[]): string | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]?.parsed;
    if (event?.kind !== 'trace' || event.trace.type !== 'generation') continue;
    const report = event.trace.data.report;
    if (typeof report === 'string' && report.trim()) return report;
  }
  return null;
}
