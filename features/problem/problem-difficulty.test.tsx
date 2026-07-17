import ProblemDifficulty from './problem-difficulty';
import { PROBLEMS_DIFFICULTY } from '@/shared/configs/difficulty';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ProblemDifficulty', () => {
  it('renders the label for a valid difficulty', () => {
    render(<ProblemDifficulty difficulty={2} />);
    expect(screen.getByText(PROBLEMS_DIFFICULTY[2])).toBeInTheDocument();
  });

  it('falls back to 暂无评定 for missing or invalid difficulty', () => {
    const { rerender } = render(<ProblemDifficulty />);
    expect(screen.getByText('暂无评定')).toBeInTheDocument();

    rerender(<ProblemDifficulty difficulty={-1} />);
    expect(screen.getByText('暂无评定')).toBeInTheDocument();

    rerender(<ProblemDifficulty difficulty={99} />);
    expect(screen.getByText('暂无评定')).toBeInTheDocument();
  });

  it('renders 暂无评定 for difficulty 0', () => {
    render(<ProblemDifficulty difficulty={0} />);
    expect(screen.getByText('暂无评定')).toBeInTheDocument();
  });
});
