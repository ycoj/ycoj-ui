import ProblemTitle from '@/features/problem/detail/problem-title';
import messages from '@/messages/en.json';
import type { Contest } from '@/shared/types/contest';
import type {
  ProblemConfig,
  PublicProjectionProblem,
} from '@/shared/types/problem';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

function makeProblem(config?: ProblemConfig): PublicProjectionProblem {
  return {
    _id: 'p'.repeat(24),
    domainId: 'system',
    docType: 10,
    docId: 1,
    pid: 'P1000',
    owner: 1,
    title: 'A + B',
    nSubmit: 3,
    nAccept: 1,
    tag: [],
    content: '',
    data: [],
    ...(config ? { config } : {}),
  } as PublicProjectionProblem;
}

function makeContest(): Contest {
  return {
    _id: 't'.repeat(24),
    domainId: 'system',
    docType: 30,
    docId: '1',
    owner: 1,
    beginAt: new Date('2026-01-01T00:00:00Z'),
    endAt: new Date('2026-01-02T00:00:00Z'),
    attend: 0,
    title: 'Sample Contest',
    content: '',
    rule: 'oi',
    pids: [],
    duration: 24,
  } as Contest;
}

function renderTitle(problem: PublicProjectionProblem, contest?: Contest) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemTitle problem={problem} contest={contest} />
    </NextIntlClientProvider>
  );
}

describe('ProblemTitle info badges', () => {
  it('falls back to default time, memory and type when config is missing', () => {
    renderTitle(makeProblem());
    expect(screen.getByText('1000ms')).toBeInTheDocument();
    expect(screen.getByText('256MiB')).toBeInTheDocument();
    expect(screen.getByText('Traditional')).toBeInTheDocument();
  });

  it('falls back to the default type when config has no type', () => {
    renderTitle(
      makeProblem({
        count: 1,
        memoryMax: 512,
        memoryMin: 128,
        timeMax: 2000,
        timeMin: 1000,
        type: '',
      })
    );
    expect(screen.getByText('Traditional')).toBeInTheDocument();
  });

  it('renders the provided config values', () => {
    renderTitle(
      makeProblem({
        count: 1,
        memoryMax: 512,
        memoryMin: 128,
        timeMax: 2000,
        timeMin: 1000,
        type: 'interactive',
      })
    );
    expect(screen.getByText('2000ms')).toBeInTheDocument();
    expect(screen.getByText('512MiB')).toBeInTheDocument();
    expect(screen.getByText('Interactive')).toBeInTheDocument();
  });
});

describe('ProblemTitle submission stats', () => {
  it('shows accepted and submission counts outside contest mode', () => {
    renderTitle(makeProblem());
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Submissions')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1 Accepted' })).toHaveAttribute(
      'href',
      '/record?pid=1&status=1'
    );
    expect(screen.getByRole('link', { name: '3 Submissions' })).toHaveAttribute(
      'href',
      '/record?pid=1'
    );
  });

  it('hides accepted and submission counts in contest mode', () => {
    renderTitle(makeProblem(), makeContest());
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument();
    expect(screen.queryByText('Submissions')).not.toBeInTheDocument();
    expect(screen.getByText('Sample Contest')).toBeInTheDocument();
  });
});

describe('ProblemTitle file I/O badge', () => {
  it('shows the serialized file I/O name for default problems with a subtype', () => {
    renderTitle(
      makeProblem({
        count: 1,
        memoryMax: 256,
        memoryMin: 256,
        timeMax: 1000,
        timeMin: 1000,
        type: 'default',
        subType: 'data',
      })
    );
    expect(screen.getByText('File I/O: data')).toBeInTheDocument();
  });

  it('does not treat an unsupported fileio type as file I/O', () => {
    renderTitle(
      makeProblem({
        count: 1,
        memoryMax: 256,
        memoryMin: 256,
        timeMax: 1000,
        timeMin: 1000,
        type: 'fileio',
        subType: 'data',
      })
    );
    expect(screen.queryByText('File I/O: data')).not.toBeInTheDocument();
  });
});
