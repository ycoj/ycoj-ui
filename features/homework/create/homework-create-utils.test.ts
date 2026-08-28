import {
  buildCreateHomeworkPayload,
  DEFAULT_PENALTY_RULES,
  getHomeworkCreateDefaults,
  isPenaltyRuleMapping,
} from '@/features/homework/create/homework-create-utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';

dayjs.extend(utc);

describe('homework create utilities', () => {
  it('creates the legacy schedule defaults in the user timezone', () => {
    const now = dayjs.utc('2026-08-28T02:07:00Z');
    const defaults = getHomeworkCreateDefaults('Asia/Shanghai', now);

    expect(defaults.beginAtDate).toBe('2026-08-29');
    expect(defaults.beginAtTime).toBe('00:00');
    expect(defaults.penaltySinceDate).toBe('2026-09-05');
    expect(defaults.penaltySinceTime).toBe('23:59');
    expect(defaults.extensionDays).toBe('1');
    expect(defaults.penaltyRules).toBe(DEFAULT_PENALTY_RULES);
    expect(defaults.maintainer).toEqual([]);
    expect(getHomeworkCreateDefaults(undefined, now)).toEqual(defaults);
  });

  it('builds the homework update operation expected by the backend handler', () => {
    const payload = buildCreateHomeworkPayload({
      ...getHomeworkCreateDefaults('Asia/Shanghai'),
      title: '  Week One  ',
      content: '  Solve every problem.  ',
      pids: [
        { docId: 1000, title: 'A' },
        { docId: 1001, title: 'B' },
      ],
      maintainer: ['2', '8'],
      assign: ['class-a', 'class-b'],
      langs: ['cc.cc17', 'python.py3'],
    });

    expect(payload).toMatchObject({
      operation: 'update',
      title: 'Week One',
      content: 'Solve every problem.',
      pids: '1000,1001',
      rated: false,
      maintainer: [2, 8],
      assign: ['class-a', 'class-b'],
      langs: ['cc.cc17', 'python.py3'],
    });
  });

  it('accepts hour-to-coefficient YAML and rejects invalid penalty rules', () => {
    expect(isPenaltyRuleMapping(DEFAULT_PENALTY_RULES)).toBe(true);
    expect(isPenaltyRuleMapping('not yaml [')).toBe(false);
    expect(isPenaltyRuleMapping('- 1\n- 2')).toBe(false);
    expect(isPenaltyRuleMapping('1: yes')).toBe(false);
  });
});
