import TrainingContent from './training-content';
import type { TrainingDetailResponse } from '@/api/server/method/training/detail';
import messages from '@/messages/en';
import type { ProblemDoc } from '@/shared/types/problem';
import type { TrainingDoc } from '@/shared/types/training';
import type { User } from '@/shared/types/user';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The shared Markdown renderer is async (MarkdownAsync) and suspends the
// whole tree in tests; stub it so the training content stays synchronous.
vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <>{children}</>,
}));

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigationMocks,
}));

const tid = 'a'.repeat(24);

function makeData(tags = ['dp', 'math']): TrainingDetailResponse {
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
    tag: tags,
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

function renderContent(showTags: boolean, tags?: string[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TrainingContent data={makeData(tags)} showTags={showTags} />
    </NextIntlClientProvider>
  );
}

describe('TrainingContent problem tags', () => {
  beforeEach(() => {
    navigationMocks.push.mockReset();
  });

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

  it('uses a client-side transition after hydration', async () => {
    const user = userEvent.setup();
    renderContent(false);

    await user.click(screen.getByRole('link', { name: 'Show tags' }));

    expect(navigationMocks.push).toHaveBeenCalledWith(
      `/training/${tid}?showTags=true`
    );
  });

  it('lets a long tag list expand the table row', () => {
    const tags = Array.from({ length: 40 }, (_, index) => `tag-${index}`);
    renderContent(true, tags);

    const firstTag = screen.getByText('tag-0');
    const tagsContainer = firstTag.closest('div');

    expect(tagsContainer).not.toBeNull();
    expect(tagsContainer).toHaveClass('flex-wrap');
    expect(tagsContainer).not.toHaveClass('max-h-20', 'overflow-y-auto');

    for (const tag of tags) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });
});
