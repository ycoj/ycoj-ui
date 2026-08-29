import type { HomeworkEditData } from '@/api/server/method/homework/edit';
import {
  buildCreateHomeworkPayload,
  DEFAULT_PENALTY_RULES,
  getHomeworkCreateDefaults,
  isPenaltyRuleMapping,
  mapHomeworkEditToFormValues,
  padDate,
  padTime,
} from '@/features/homework/form/homework-form-utils';
import type { Homework } from '@/shared/types/homework';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';

dayjs.extend(utc);

function makeTdoc(overrides: Partial<Homework> = {}): Homework {
  return {
    _id: 'id',
    docId: 'tid',
    docType: 30,
    domainId: 'system',
    owner: 1,
    maintainer: [2],
    beginAt: new Date('2026-08-29T16:00:00.000Z'),
    endAt: new Date('2026-09-06T15:59:00.000Z'),
    attend: 0,
    title: 'Week One',
    content: 'Solve every problem.',
    rule: 'homework',
    pids: [1000, 1001],
    duration: 0,
    penaltySince: new Date('2026-09-05T15:59:00.000Z'),
    ...overrides,
  };
}

function makeEditData(
  overrides: Partial<HomeworkEditData> = {},
  tdocOverrides: Partial<Homework> = {}
): HomeworkEditData {
  return {
    tdoc: makeTdoc(tdocOverrides),
    dateBeginText: '2026-8-29',
    timeBeginText: '0:00',
    datePenaltyText: '2026-9-5',
    timePenaltyText: '23:59',
    extensionDays: 1,
    penaltyRules: '1: 0.9\n',
    pids: '1000,1001',
    page_name: 'homework_edit',
    ...overrides,
  };
}

describe('homework form utilities', () => {
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

  it('zero-pads unpadded date and time strings from the edit GET', () => {
    expect(padDate('2026-8-9')).toBe('2026-08-09');
    expect(padDate('2026-08-29')).toBe('2026-08-29');
    expect(padTime('9:05')).toBe('09:05');
    expect(padTime('0:00')).toBe('00:00');
  });

  it('maps edit GET data into form values', () => {
    const values = mapHomeworkEditToFormValues(makeEditData(), [
      { docId: 1000, title: 'A' },
      { docId: 1001, title: 'B' },
    ]);

    expect(values).toMatchObject({
      title: 'Week One',
      beginAtDate: '2026-08-29',
      beginAtTime: '00:00',
      penaltySinceDate: '2026-09-05',
      penaltySinceTime: '23:59',
      extensionDays: '1',
      penaltyRules: '1: 0.9\n',
      maintainer: ['2'],
      content: 'Solve every problem.',
    });
  });

  it('falls back to default penalty rules when the edit GET omits them', () => {
    const values = mapHomeworkEditToFormValues(
      makeEditData({ penaltyRules: null }, { langs: ['python.py3'] }),
      [{ docId: 1000, title: 'A' }]
    );

    expect(values.penaltyRules).toBe(DEFAULT_PENALTY_RULES);
    expect(values.langs).toEqual(['python.py3']);
  });
});
