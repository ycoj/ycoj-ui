import { AiGenerationTimeline } from '@/features/record/detail/ai-generation/ai-generation-timeline';
import type { AiTraceEvent } from '@/features/record/detail/ai-generation/ai-generation-trace';
import messages from '@/messages/en';
import messagesZh from '@/messages/zh';
import type {
  AiTraceEventType,
  AiTraceState,
  TestCaseResponse,
} from '@/shared/types/record';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

function renderTimeline(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function makeTestcase(id: number, status = 20): TestCaseResponse {
  return {
    id,
    subtaskId: 0,
    score: 0,
    time: 0,
    memory: 0,
    status,
    message: '',
  };
}

function makeTraceEvent(
  id: number,
  type: AiTraceEventType,
  state: AiTraceState,
  data: Record<string, unknown> = {}
): AiTraceEvent {
  return {
    testcase: makeTestcase(id, state === 'running' ? 20 : 1),
    parsed: {
      kind: 'trace',
      trace: {
        schema: 'hydro.ai-generation.trace',
        version: 1,
        seq: id,
        type,
        state,
        startedAt: '2026-08-16T12:00:00.000Z',
        data,
      },
    },
  };
}

test('renders a spinner for running trace events and checks for every terminal state', async () => {
  await renderTimeline(
    <AiGenerationTimeline
      events={[
        makeTraceEvent(1, 'generation', 'running'),
        makeTraceEvent(2, 'preparation', 'succeeded'),
        makeTraceEvent(3, 'agent_turn', 'failed'),
        makeTraceEvent(4, 'validation', 'cancelled'),
        makeTraceEvent(5, 'replacement', 'timed_out'),
      ]}
    />
  );

  for (const label of [
    'Generation',
    'Preparation',
    'Agent turn',
    'Validation',
    'Replacement',
  ]) {
    await expect.element(page.getByText(label, { exact: true })).toBeVisible();
  }

  const spinner = page.getByRole('img', { name: 'Running' });
  await expect.element(spinner).toBeVisible();
  await expect
    .poll(() => {
      const element = spinner.element();
      const target =
        element.tagName.toLowerCase() === 'svg'
          ? element
          : element.querySelector('svg');
      return target ? getComputedStyle(target).animationName : 'none';
    })
    .toContain('spin');

  for (const label of ['Completed', 'Failed', 'Cancelled', 'Timed out']) {
    await expect.element(page.getByRole('img', { name: label })).toBeVisible();
  }
});

test('renders Read and Edit paths as inline code with state-aware actions', async () => {
  await renderTimeline(
    <AiGenerationTimeline
      events={[
        makeTraceEvent(1, 'tool', 'running', {
          tool: 'Read',
          summary: 'input.txt',
        }),
        makeTraceEvent(2, 'tool', 'succeeded', {
          tool: 'Read',
          details: { path: 'problem.md' },
        }),
        makeTraceEvent(3, 'tool', 'running', {
          tool: 'Edit',
          summary: 'generator.py',
        }),
        makeTraceEvent(4, 'tool', 'succeeded', {
          tool: 'Edit',
          details: { path: 'solution.cpp' },
        }),
      ]}
    />
  );

  const rows = page.getByRole('listitem');
  await expect.poll(() => rows.elements().length).toBe(4);

  for (const [index, label, path] of [
    [0, 'Reading', 'input.txt'],
    [1, 'Read', 'problem.md'],
    [2, 'Editing', 'generator.py'],
    [3, 'Edited', 'solution.cpp'],
  ] as const) {
    const row = rows.nth(index);
    await expect.element(row.getByText(label)).toBeVisible();
    const code = row.getByText(path);
    await expect.element(code).toBeVisible();
    expect(code.element().tagName).toBe('CODE');
  }
});

test('uses a spinner for every running tool', async () => {
  await renderTimeline(
    <AiGenerationTimeline
      events={[
        makeTraceEvent(1, 'tool', 'running', {
          tool: 'Read',
          summary: 'input.txt',
        }),
        makeTraceEvent(2, 'tool', 'running', {
          tool: 'Edit',
          summary: 'generator.py',
        }),
        makeTraceEvent(3, 'tool', 'running', {
          tool: 'Shell',
          summary: 'python3 generator.py',
        }),
      ]}
    />
  );

  await expect
    .poll(() => page.getByRole('img', { name: 'Running' }).elements().length)
    .toBe(3);
});

test('expands and collapses Shell commands from details and summaries', async () => {
  await renderTimeline(
    <AiGenerationTimeline
      events={[
        makeTraceEvent(1, 'tool', 'running', {
          tool: 'Shell',
          summary: 'python3 running.py',
        }),
        makeTraceEvent(2, 'tool', 'succeeded', {
          tool: 'Shell',
          summary: 'Accepted, exit 0',
          details: { command: 'python3 generator.py' },
        }),
      ]}
    />
  );

  const runningTrigger = page.getByRole('button', {
    name: 'Running python3',
  });
  const completedTrigger = page.getByRole('button', {
    name: 'Ran python3',
  });
  await expect.element(runningTrigger).toBeVisible();
  await expect.element(completedTrigger).toBeVisible();

  await expect
    .element(page.getByText('python3 running.py', { exact: true }))
    .not.toBeInTheDocument();
  await userEvent.click(runningTrigger);
  const runningCode = page.getByText('python3 running.py', { exact: true });
  await expect.element(runningCode).toBeVisible();
  expect(runningCode.element().tagName).toBe('CODE');

  await expect
    .element(page.getByText('python3 generator.py', { exact: true }))
    .not.toBeInTheDocument();
  await userEvent.click(completedTrigger);
  const completedCode = page.getByText('python3 generator.py', {
    exact: true,
  });
  await expect.element(completedCode).toBeVisible();
  expect(completedCode.element().tagName).toBe('CODE');
  await userEvent.click(completedTrigger);
  await expect.element(completedCode).not.toBeInTheDocument();
});

test('labels Shell commands with parsed command names', async () => {
  await renderTimeline(
    <AiGenerationTimeline
      events={[
        makeTraceEvent(1, 'tool', 'succeeded', {
          tool: 'Shell',
          details: {
            command: "find . -maxdepth 2 -type f | sort | sed -n '1,200p'",
          },
        }),
        makeTraceEvent(2, 'tool', 'succeeded', {
          tool: 'Shell',
          details: { command: 'a 1 | b 2 | c 3 | d 4 | e 5 | f 6' },
        }),
      ]}
    />
  );

  await expect
    .element(
      page.getByRole('button', { name: 'Ran find, sort, sed (3 commands)' })
    )
    .toBeVisible();
  for (const name of ['find', 'sort', 'sed']) {
    await expect.element(page.getByText(name, { exact: true })).toBeVisible();
  }

  await expect
    .element(
      page.getByRole('button', { name: 'Ran a, b, c, d, e (6 commands)' })
    )
    .toBeVisible();
  await expect
    .element(page.getByText('f', { exact: true }))
    .not.toBeInTheDocument();
});

test('falls back to summaries and omits missing tool values', async () => {
  const { container } = await renderTimeline(
    <AiGenerationTimeline
      events={[
        makeTraceEvent(1, 'tool', 'succeeded', {
          tool: 'Read',
          summary: 'fallback.md',
        }),
        makeTraceEvent(2, 'tool', 'succeeded', { tool: 'Edit' }),
        makeTraceEvent(3, 'tool', 'succeeded', { tool: 'Shell' }),
      ]}
    />
  );

  await expect
    .element(page.getByText('fallback.md', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('Edited', { exact: true })).toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Ran Command' }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByText('Ran Command', { exact: true }))
    .toBeVisible();
  expect(container.textContent).not.toContain('undefined');
});

test('renders the English empty state and plain-text fallback', async () => {
  const view = await renderTimeline(<AiGenerationTimeline events={[]} />);

  await expect
    .element(page.getByText('Run timeline', { exact: true }))
    .toBeVisible();
  await expect
    .element(
      page.getByText('No trace events have been recorded yet.', { exact: true })
    )
    .toBeVisible();

  await view.rerender(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AiGenerationTimeline
        events={[
          {
            testcase: { ...makeTestcase(7, 8), time: 42 },
            parsed: { kind: 'text', text: 'legacy trace text' },
          },
        ]}
      />
    </NextIntlClientProvider>
  );

  await expect.element(page.getByText('#7', { exact: true })).toBeVisible();
  await expect
    .element(page.getByText('legacy trace text', { exact: true }))
    .toBeVisible();
});

test('translates event and tool labels', async () => {
  await render(
    <NextIntlClientProvider locale="zh" messages={messagesZh}>
      <AiGenerationTimeline
        events={[
          makeTraceEvent(1, 'generation', 'succeeded'),
          makeTraceEvent(2, 'tool', 'succeeded', {
            tool: 'Read',
            details: { path: 'problem.md' },
          }),
        ]}
      />
    </NextIntlClientProvider>
  );

  await expect
    .element(page.getByText('执行时间线', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('生成测试数据', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('已读取')).toBeVisible();
  const path = page.getByText('problem.md', { exact: true });
  await expect.element(path).toBeVisible();
  expect(path.element().tagName).toBe('CODE');
  await expect.element(page.getByRole('img', { name: '已完成' })).toBeVisible();
});
