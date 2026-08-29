import {
  buildTrainingPayload,
  getNextSectionId,
  getTrainingCreateDefaults,
  hasDuplicateSectionIds,
  hasInvalidRequireNids,
  mapTrainingEditToFormValues,
  type TrainingSectionValue,
} from './training-form-utils';
import { describe, expect, it } from 'vitest';

function makeSection(
  overrides: Partial<TrainingSectionValue> = {}
): TrainingSectionValue {
  return {
    id: 1,
    title: 'Section',
    requireNids: [],
    pids: [{ docId: 1000, pid: 'P1000', title: 'A+B Problem' }],
    ...overrides,
  };
}

describe('getTrainingCreateDefaults', () => {
  it('returns a single empty section', () => {
    const defaults = getTrainingCreateDefaults();
    expect(defaults.pin).toBe('0');
    expect(defaults.sections).toEqual([
      { id: 1, title: '', requireNids: [], pids: [] },
    ]);
  });
});

describe('buildTrainingPayload', () => {
  it('trims text fields and serializes the dag as JSON', () => {
    const payload = buildTrainingPayload({
      title: '  My Training  ',
      pin: '3',
      content: '  intro ',
      description: '  details ',
      sections: [
        makeSection({ id: 1, title: ' First ' }),
        makeSection({
          id: 2,
          title: 'Second',
          requireNids: [1, 1],
          pids: [
            { docId: 2, title: 'Two' },
            { docId: 3, title: 'Three' },
          ],
        }),
      ],
    });

    expect(payload.title).toBe('My Training');
    expect(payload.content).toBe('intro');
    expect(payload.description).toBe('details');
    expect(payload.pin).toBe(3);
    expect(JSON.parse(payload.dag)).toEqual([
      { _id: 1, title: 'First', requireNids: [], pids: [1000] },
      { _id: 2, title: 'Second', requireNids: [1], pids: [2, 3] },
    ]);
  });

  it('falls back to pin 0 for invalid input', () => {
    const payload = buildTrainingPayload({
      ...getTrainingCreateDefaults(),
      pin: '',
    });
    expect(payload.pin).toBe(0);
  });
});

describe('mapTrainingEditToFormValues', () => {
  it('maps tdoc fields and keeps resolved sections', () => {
    const sections = [makeSection({ id: 5 })];
    const values = mapTrainingEditToFormValues(
      { title: 'T', content: 'C', description: 'D', pin: 2 },
      sections
    );
    expect(values).toEqual({
      title: 'T',
      pin: '2',
      content: 'C',
      description: 'D',
      sections,
    });
  });

  it('defaults missing pin to 0', () => {
    const values = mapTrainingEditToFormValues(
      { title: 'T', content: 'C', description: 'D' },
      []
    );
    expect(values.pin).toBe('0');
  });
});

describe('getNextSectionId', () => {
  it('returns one more than the current max id', () => {
    expect(getNextSectionId([])).toBe(1);
    expect(getNextSectionId([{ id: 2 }, { id: 5 }])).toBe(6);
  });
});

describe('hasDuplicateSectionIds', () => {
  it('detects duplicates', () => {
    expect(hasDuplicateSectionIds([{ id: 1 }, { id: 2 }])).toBe(false);
    expect(hasDuplicateSectionIds([{ id: 1 }, { id: 1 }])).toBe(true);
  });
});

describe('hasInvalidRequireNids', () => {
  const sections = [{ id: 1 }, { id: 2 }];

  it('accepts references to other existing sections', () => {
    expect(hasInvalidRequireNids({ id: 2, requireNids: [1] }, sections)).toBe(
      false
    );
  });

  it('rejects self references', () => {
    expect(hasInvalidRequireNids({ id: 1, requireNids: [1] }, sections)).toBe(
      true
    );
  });

  it('rejects references to missing sections', () => {
    expect(hasInvalidRequireNids({ id: 1, requireNids: [9] }, sections)).toBe(
      true
    );
  });
});
