import {
  getProblemDifficultyTextColor,
  PROBLEMS_DIFFICULTY_TEXT_COLOR,
} from '@/shared/configs/difficulty';
import { describe, expect, it } from 'vitest';

describe('getProblemDifficultyTextColor', () => {
  it.each([0, 1, 5, 8])('returns the level %i text color', (difficulty) => {
    expect(getProblemDifficultyTextColor(difficulty)).toBe(
      PROBLEMS_DIFFICULTY_TEXT_COLOR[difficulty]
    );
  });

  it.each([undefined, -1, 9, 99])(
    'falls back to the unrated color for %s',
    (difficulty) => {
      expect(getProblemDifficultyTextColor(difficulty)).toBe(
        PROBLEMS_DIFFICULTY_TEXT_COLOR[0]
      );
    }
  );
});
