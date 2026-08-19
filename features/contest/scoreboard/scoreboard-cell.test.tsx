import ScoreboardCell, {
  getScoreColorClass,
} from '@/features/contest/scoreboard/scoreboard-cell';
import messages from '@/messages/en.json';
import type { ScoreboardNode } from '@/shared/types/contest';
import type { ProblemDict, ProblemDoc } from '@/shared/types/problem';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

describe('getScoreColorClass', () => {
  it('uses green for scores >= 100', () => {
    expect(getScoreColorClass(100)).toContain('text-green-600');
    expect(getScoreColorClass(100)).toContain('font-semibold');
    expect(getScoreColorClass(100)).not.toContain('text-orange-500');
    expect(getScoreColorClass(100)).not.toContain('text-red-500');
  });

  it('uses orange for scores in [60, 100)', () => {
    expect(getScoreColorClass(60)).toContain('text-orange-500');
    expect(getScoreColorClass(99)).toContain('text-orange-500');
    expect(getScoreColorClass(60)).not.toContain('text-green-600');
    expect(getScoreColorClass(60)).not.toContain('text-red-500');
  });

  it('uses red for scores < 60', () => {
    expect(getScoreColorClass(0)).toContain('text-red-500');
    expect(getScoreColorClass(59)).toContain('text-red-500');
    expect(getScoreColorClass(0)).not.toContain('text-green-600');
    expect(getScoreColorClass(0)).not.toContain('text-orange-500');
  });
});

describe('ScoreboardCell problem header links', () => {
  it('renders problem header with link /problem/:pid?tid=:tid when tid is provided', () => {
    const node: ScoreboardNode = {
      type: 'problem',
      value: 'A',
      raw: 1000,
    };

    render(<ScoreboardCell node={node} isHeader tid="contest123" />);

    const link = screen.getByRole('link', { name: 'A' });
    expect(link).toHaveAttribute('href', '/problem/1000?tid=contest123');
  });

  it('resolves problem pid/docId from pdict if available', () => {
    const node: ScoreboardNode = {
      type: 'problem',
      value: 'B',
      raw: 1001,
    };
    const pdict: ProblemDict = {
      1001: {
        _id: 'p123',
        docId: 1001,
        pid: 'P1001',
        title: 'Problem B',
      } as unknown as ProblemDoc,
    };

    render(
      <ScoreboardCell node={node} isHeader pdict={pdict} tid="contest456" />
    );

    const link = screen.getByRole('link', { name: 'B' });
    expect(link).toHaveAttribute('href', '/problem/P1001?tid=contest456');
  });

  it('renders problem header with link /problem/:pid when tid is not provided', () => {
    const node: ScoreboardNode = {
      type: 'problem',
      value: 'C',
      raw: 1002,
    };

    render(<ScoreboardCell node={node} isHeader />);

    const link = screen.getByRole('link', { name: 'C' });
    expect(link).toHaveAttribute('href', '/problem/1002');
  });

  it('renders problem as text when not a header', () => {
    const node: ScoreboardNode = {
      type: 'problem',
      value: 'A',
      raw: 1000,
    };

    render(<ScoreboardCell node={node} isHeader={false} tid="contest123" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

describe('ScoreboardCell correction records', () => {
  it('renders serialized record nodes and links both contest and correction records', () => {
    const node: ScoreboardNode = {
      type: 'records',
      value: '',
      raw: [
        { value: 40, score: 40, raw: 'contest-record' },
        { value: 100, score: 100, raw: 'correction-record' },
      ],
    };

    render(<ScoreboardCell node={node} />);

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '40' }).parentElement?.parentElement
    ).toHaveTextContent('40 / 100');
    expect(screen.getByRole('link', { name: '40' })).toHaveAttribute(
      'href',
      '/record/contest-record'
    );
    expect(screen.getByRole('link', { name: '100' })).toHaveAttribute(
      'href',
      '/record/correction-record'
    );
  });
});

describe('ScoreboardCell first solves', () => {
  it('renders a first-solve indicator without changing the record link', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ScoreboardCell
          node={{
            type: 'record',
            value: '+1\n01:00',
            raw: 'first-record',
            score: 100,
            first: true,
          }}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText('First solve')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+1/ })).toHaveAttribute(
      'href',
      '/record/first-record'
    );
  });

  it('does not render the indicator for regular records', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ScoreboardCell
          node={{
            type: 'record',
            value: '+1',
            raw: 'regular-record',
            score: 100,
          }}
        />
      </NextIntlClientProvider>
    );

    expect(screen.queryByLabelText('First solve')).not.toBeInTheDocument();
  });
});
