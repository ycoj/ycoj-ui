import ProblemList from './problem-list';
import type { ProblemListResponse } from '@/api/server/method/problems/list';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

function makeProblem(
  overrides: Partial<ProblemListResponse['pdocs'][number]> = {}
) {
  return {
    _id: 'p'.repeat(24),
    domainId: 'system',
    docType: 10 as const,
    docId: 1000,
    pid: 'P1000',
    owner: 1,
    title: 'A + B',
    nSubmit: 10,
    nAccept: 5,
    tag: [],
    hidden: false,
    ...overrides,
  } as ProblemListResponse['pdocs'][number];
}

function makeData(pdocs: ProblemListResponse['pdocs']): ProblemListResponse {
  return {
    page: 1,
    pcount: pdocs.length,
    ppcount: 1,
    pcountRelation: 'eq',
    pdocs,
    psdict: {},
    qs: '',
  };
}

function renderList(data: ProblemListResponse) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemList data={data} showTags={false} searchParams={{}} />
    </NextIntlClientProvider>
  );
}

describe('ProblemList pid display', () => {
  it('shows pid when present', () => {
    const problem = makeProblem({ docId: 1000, pid: 'P1000' });
    renderList(makeData([problem]));
    expect(screen.getByText('P1000')).toBeInTheDocument();
    expect(screen.getByText('P1000').closest('td')).toHaveAttribute(
      'data-llm-text',
      'P1000'
    );
  });

  it('falls back to P+docId when pid is missing', () => {
    const problem = makeProblem({
      docId: 1001,
      pid: undefined,
    });
    renderList(makeData([problem]));
    expect(screen.getByText('P1001')).toBeInTheDocument();
    expect(screen.getByText('P1001').closest('td')).toHaveAttribute(
      'data-llm-text',
      'P1001'
    );
  });

  it('falls back to P+docId when pid is empty string', () => {
    const problem = makeProblem({ docId: 1002, pid: '' });
    renderList(makeData([problem]));
    expect(screen.getByText('P1002')).toBeInTheDocument();
  });

  it('handles mixed pids correctly', () => {
    const withPid = makeProblem({ docId: 1000, pid: 'ABC123' });
    const withoutPid = makeProblem({
      docId: 2000,
      pid: undefined,
    } as unknown as Record<string, unknown>);
    delete (withoutPid as unknown as Record<string, unknown>).pid;
    const emptyPid = makeProblem({ docId: 3000, pid: '' });
    renderList(makeData([withPid, withoutPid, emptyPid]));
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('P2000')).toBeInTheDocument();
    expect(screen.getByText('P3000')).toBeInTheDocument();
  });
});
