import AiGenerationLog from './ai-generation-log';
import messages from '@/messages/en.json';
import messagesZh from '@/messages/zh.json';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/problem/problem-link', () => ({
  default: () => <span>problem-link</span>,
}));
vi.mock('@/features/user/user-span', () => ({
  default: () => <span>user-span</span>,
}));

const makeTrace = (value: Record<string, unknown>) => JSON.stringify(value);

const baseRecord: RecordDoc = {
  _id: '66ab1234567890abcdef1234',
  domainId: 'system',
  pid: 1000,
  uid: 2,
  lang: 'ai',
  code: 'Prefer adversarial cases.',
  score: 0,
  memory: 0,
  time: 0,
  judgeTexts: [],
  compilerTexts: [],
  testCases: [
    {
      id: 1,
      subtaskId: 0,
      score: 0,
      time: 0,
      memory: 0,
      status: 20,
      message: makeTrace({
        schema: 'hydro.ai-generation.trace',
        version: 1,
        seq: 1,
        type: 'tool',
        state: 'running',
        startedAt: '2026-08-16T12:00:00.000Z',
        data: { tool: 'Read', summary: 'problem.md' },
      }),
    },
    {
      id: 2,
      subtaskId: 0,
      score: 0,
      time: 42,
      memory: 0,
      status: 1,
      message: makeTrace({
        schema: 'hydro.ai-generation.trace',
        version: 1,
        seq: 2,
        type: 'generation',
        state: 'succeeded',
        startedAt: '2026-08-16T12:00:00.000Z',
        finishedAt: '2026-08-16T12:00:00.042Z',
        data: {
          report: 'Generated adversarial cases.',
          caseCount: 12,
          totalBytes: 4096,
        },
      }),
    },
  ],
  rejudged: false,
  judger: 1,
  judgeAt: '2026-08-16T12:00:00.042Z',
  status: 20,
  progress: 75,
  aiGeneration: {
    active: true,
    stage: 'validating',
    model: 'gpt-5',
    startedAt: '2026-08-16T12:00:00.000Z',
  },
};

const pdoc = { docId: 1000, title: 'Problem' } as ProblemDoc;
const udoc = { _id: 2, uname: 'alice' } as User;

function renderLog(
  overrides: Partial<RecordDoc> = {},
  onCancel = vi.fn<() => Promise<void>>(),
  locale = 'en',
  localeMessages = messages
) {
  return {
    onCancel,
    ...render(
      <NextIntlClientProvider locale={locale} messages={localeMessages}>
        <AiGenerationLog
          rdoc={{ ...baseRecord, ...overrides }}
          pdoc={pdoc}
          udoc={udoc}
          allowCancel
          onCancel={onCancel}
        />
      </NextIntlClientProvider>
    ),
  };
}

describe('AiGenerationLog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders live stage, trace events, report, and output summary', () => {
    renderLog();

    expect(screen.getByText('Validating')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('problem.md').tagName).toBe('CODE');
    expect(screen.getByText('Generation')).toBeInTheDocument();
    expect(screen.getByText('Generation report')).toBeInTheDocument();
    expect(
      screen.getByText('Generated adversarial cases.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Installed cases: 12/)).toBeInTheDocument();
    expect(screen.getByText(/Total size: 4KiB/)).toBeInTheDocument();
  });

  it('shows plain text events and hides cancellation after status 9', () => {
    renderLog({
      status: 9,
      aiGeneration: {
        ...baseRecord.aiGeneration!,
        active: true,
        stage: 'cancelled',
      },
      testCases: [{ ...baseRecord.testCases[0], message: 'legacy trace text' }],
    });

    expect(screen.getByText('legacy trace text')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel generation' })
    ).toBeNull();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('reports cancellation failures', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn().mockRejectedValue(new Error('permission denied'));
    renderLog({}, onCancel);

    await user.click(screen.getByRole('button', { name: 'Cancel generation' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'permission denied'
    );
  });

  it('renders tool-specific labels and expands shell commands', async () => {
    const user = userEvent.setup();
    renderLog({
      testCases: [
        {
          ...baseRecord.testCases[0],
          message: makeTrace({
            schema: 'hydro.ai-generation.trace',
            version: 1,
            seq: 1,
            type: 'tool',
            state: 'succeeded',
            startedAt: '2026-08-16T12:00:00.000Z',
            data: {
              tool: 'Read',
              summary: '2/10 line(s)',
              details: {
                path: 'problem.md',
                offset: 2,
                lines: 2,
                totalLines: 10,
                truncated: false,
              },
            },
          }),
        },
        {
          ...baseRecord.testCases[0],
          id: 2,
          message: makeTrace({
            schema: 'hydro.ai-generation.trace',
            version: 1,
            seq: 2,
            type: 'tool',
            state: 'succeeded',
            startedAt: '2026-08-16T12:00:00.000Z',
            data: {
              tool: 'Edit',
              summary: '32 byte(s)',
              details: { path: 'generator.py', bytes: 32 },
            },
          }),
        },
        {
          ...baseRecord.testCases[0],
          id: 3,
          message: makeTrace({
            schema: 'hydro.ai-generation.trace',
            version: 1,
            seq: 3,
            type: 'tool',
            state: 'succeeded',
            startedAt: '2026-08-16T12:00:00.000Z',
            data: {
              tool: 'Shell',
              summary: 'Accepted, exit 0',
              details: {
                command: 'python3 generator.py',
                status: 'Accepted',
                exitStatus: 0,
              },
            },
          }),
        },
      ],
    });

    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('problem.md').tagName).toBe('CODE');
    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.getByText('generator.py').tagName).toBe('CODE');

    const shellTrigger = screen.getByRole('button', { name: 'Ran python3' });
    expect(screen.queryByText('python3 generator.py')).toBeNull();
    await user.click(shellTrigger);
    expect(screen.getByText('python3 generator.py')).toBeVisible();
    expect(screen.queryByText('Tool call')).toBeNull();
  });

  it('translates timeline events for the active locale', () => {
    renderLog(
      {
        testCases: [
          {
            ...baseRecord.testCases[0],
            message: makeTrace({
              schema: 'hydro.ai-generation.trace',
              version: 1,
              seq: 1,
              type: 'tool',
              state: 'succeeded',
              startedAt: '2026-08-16T12:00:00.000Z',
              data: {
                tool: 'Read',
                details: { path: 'problem.md', lines: 2 },
              },
            }),
          },
        ],
      },
      vi.fn<() => Promise<void>>(),
      'zh',
      messagesZh
    );

    expect(screen.getByText('执行时间线')).toBeInTheDocument();
    expect(screen.getByText('已读取')).toBeInTheDocument();
    expect(screen.getByText('problem.md').tagName).toBe('CODE');
  });
});
