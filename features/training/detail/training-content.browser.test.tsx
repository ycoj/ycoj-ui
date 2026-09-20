import TrainingContent from './training-content';
import type { TrainingDetailResponse } from '@/api/server/method/training/detail';
import messages from '@/messages/en';
import type { ProblemDoc } from '@/shared/types/problem';
import type { TrainingDoc } from '@/shared/types/training';
import type { User } from '@/shared/types/user';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

// The shared Markdown renderer is async (MarkdownAsync) and suspends the
// whole tree in tests; stub it so the training content stays synchronous.
vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <>{children}</>,
}));

const tid = 'a'.repeat(24);

function makeData(): TrainingDetailResponse {
  const tdoc = {
    docId: tid,
    docType: 20,
    domainId: 'system',
    title: 'Training',
    content: '',
    description: '',
    owner: 1,
    dag: [{ _id: 1, title: 'Basics', requireNids: [], pids: [1000] }],
    attend: 1,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  } as TrainingDoc;
  const problem = {
    _id: 'p'.repeat(24),
    domainId: 'system',
    docType: 10,
    docId: 1000,
    pid: 'P1000',
    owner: 1,
    title: 'A + B',
    tag: ['dp', 'math'],
  } as ProblemDoc;

  return {
    tdoc,
    tsdoc: {} as TrainingDetailResponse['tsdoc'],
    pids: [1000],
    pdict: { 1000: problem },
    psdict: {},
    ndict: {},
    nsdict: {},
    udoc: {} as User,
    udict: {},
    selfPsdict: {},
    groups: [],
    missing: [],
  };
}

function renderContent(showTags: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TrainingContent data={makeData()} showTags={showTags} />
    </NextIntlClientProvider>
  );
}

describe('TrainingContent problem tags', () => {
  it('hides tags by default and links to enable them', () => {
    renderContent(false);

    expect(screen.queryByText('dp')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Show tags' })).toHaveAttribute(
      'href',
      `/training/${tid}?showTags=true`
    );
  });

  it('shows tags when enabled and links to hide them', () => {
    renderContent(true);

    expect(screen.getByText('dp')).toBeInTheDocument();
    expect(screen.getByText('math')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hide tags' })).toHaveAttribute(
      'href',
      `/training/${tid}?showTags=false`
    );
  });
});
