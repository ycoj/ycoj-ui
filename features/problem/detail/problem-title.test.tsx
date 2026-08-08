import ProblemTitle from './problem-title';
import messages from '@/messages/en.json';
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

function renderTitle(problem: PublicProjectionProblem) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemTitle problem={problem} />
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
