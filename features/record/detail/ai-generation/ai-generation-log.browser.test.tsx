import AiGenerationLog from '@/features/record/detail/ai-generation/ai-generation-log';
import messages from '@/messages/en.json';
import messagesZh from '@/messages/zh.json';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
    rendered: render(
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

beforeEach(() => vi.clearAllMocks());

test('renders live stage, trace events, report, and output summary', async () => {
  const { rendered } = renderLog();
  await rendered;

  const texts: Array<[text: string, exact: boolean]> = [
    ['Validating', true],
    ['75%', true],
    ['Reading', false],
    ['problem.md', true],
    ['Generation', true],
    ['Generation report', true],
    ['Generated adversarial cases.', true],
  ];
  for (const [text, exact] of texts) {
    await expect.element(page.getByText(text, { exact })).toBeVisible();
  }
  await expect.element(page.getByText(/Installed cases: 12/)).toBeVisible();
  await expect.element(page.getByText(/Total size: 4KiB/)).toBeVisible();
});

test('shows plain text events and hides cancellation after status 9', async () => {
  const { rendered } = renderLog({
    status: 9,
    aiGeneration: {
      ...baseRecord.aiGeneration!,
      active: true,
      stage: 'cancelled',
    },
    testCases: [{ ...baseRecord.testCases[0], message: 'legacy trace text' }],
  });
  await rendered;

  await expect
    .element(page.getByText('legacy trace text', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Cancel generation' }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByText('Cancelled', { exact: true }))
    .toBeVisible();
});

test('reports cancellation failures', async () => {
  const onCancel = vi.fn().mockRejectedValue(new Error('permission denied'));
  const { rendered } = renderLog({}, onCancel);
  await rendered;

  await userEvent.click(
    page.getByRole('button', { name: 'Cancel generation' })
  );

  expect(onCancel).toHaveBeenCalledTimes(1);
  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('permission denied');
});

test('renders tool-specific labels and expands shell commands', async () => {
  const { rendered } = renderLog({
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
  await rendered;

  await expect.element(page.getByText('Read')).toBeVisible();
  await expect
    .element(page.getByText('problem.md', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('Edited')).toBeVisible();
  await expect
    .element(page.getByText('generator.py', { exact: true }))
    .toBeVisible();

  const shellTrigger = page.getByRole('button', { name: 'Ran python3' });
  await expect.element(shellTrigger).toBeVisible();
  await expect
    .element(page.getByText('python3 generator.py', { exact: true }))
    .not.toBeInTheDocument();
  await userEvent.click(shellTrigger);
  await expect
    .element(page.getByText('python3 generator.py', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('Tool call', { exact: true }))
    .not.toBeInTheDocument();
});

test('translates timeline events for the active locale', async () => {
  const { rendered } = renderLog(
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
  await rendered;

  await expect
    .element(page.getByText('执行时间线', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('已读取')).toBeVisible();
  await expect
    .element(page.getByText('problem.md', { exact: true }))
    .toBeVisible();
});
