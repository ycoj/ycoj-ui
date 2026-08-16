import { formatTestcaseMessage } from '@/features/record/detail/format-testcase-message';
import { describe, expect, it } from 'vitest';

describe('formatTestcaseMessage', () => {
  it('returns plain messages unchanged', () => {
    expect(formatTestcaseMessage('Wrong answer')).toBe('Wrong answer');
  });

  it('substitutes structured message params', () => {
    expect(
      formatTestcaseMessage({
        message: 'On line {0}: Read {1}, expect {2}.',
        params: [2, '1', '1000000000'],
      })
    ).toBe('On line 2: Read 1, expect 1000000000.');
  });

  it('preserves placeholders whose params are missing', () => {
    expect(
      formatTestcaseMessage({
        message: 'Read {0}, expect {1}.',
        params: ['1'],
      })
    ).toBe('Read 1, expect {1}.');
  });
});
