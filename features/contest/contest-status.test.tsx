import ContestStatus, {
  getContestStatusBadgeClassName,
  getContestStatusLabel,
  getContestStatusTextClassName,
} from './contest-status';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('contest status helpers', () => {
  it('maps status to Chinese labels', () => {
    expect(getContestStatusLabel('running')).toBe('进行中');
    expect(getContestStatusLabel('pending')).toBe('即将开始');
    expect(getContestStatusLabel('ended')).toBe('已结束');
  });

  it('returns distinct text classes by status', () => {
    expect(getContestStatusTextClassName('running')).toContain('text-pink-600');
    expect(getContestStatusTextClassName('pending')).toContain('text-blue-500');
    expect(getContestStatusTextClassName('ended')).toContain('text-foreground');
  });

  it('returns badge classes with running/pending overrides', () => {
    expect(getContestStatusBadgeClassName('running')).toContain('bg-pink-100');
    expect(getContestStatusBadgeClassName('pending')).toContain('bg-blue-100');
    expect(getContestStatusBadgeClassName('ended')).toContain('bg-muted');
  });
});

describe('ContestStatus', () => {
  it('renders the label for the given status', () => {
    render(<ContestStatus status="running" />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('renders pending and ended labels', () => {
    const { rerender } = render(<ContestStatus status="pending" />);
    expect(screen.getByText('即将开始')).toBeInTheDocument();

    rerender(<ContestStatus status="ended" />);
    expect(screen.getByText('已结束')).toBeInTheDocument();
  });
});
