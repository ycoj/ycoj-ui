import { AiGenerationTimeline } from './ai-generation-timeline';
import type { AiTraceEvent } from './ai-generation-trace';
import messages from '@/messages/en.json';
import messagesZh from '@/messages/zh.json';
import type {
  AiTraceEventType,
  AiTraceState,
  TestCaseResponse,
} from '@/shared/types/record';
import {
  render as testingLibraryRender,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

function render(ui: ReactElement) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
  });
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

describe('AiGenerationTimeline', () => {
  it('renders a spinner for running trace events and checks for every terminal state', () => {
    render(
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

    expect(screen.getByText('Generation')).toBeInTheDocument();
    expect(screen.getByText('Preparation')).toBeInTheDocument();
    expect(screen.getByText('Agent turn')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Replacement')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Running' })).toHaveClass(
      'animate-spin'
    );
    expect(screen.getAllByRole('img', { name: 'Completed' })).toHaveLength(4);
  });

  it('renders Read and Edit paths as inline code with state-aware actions', () => {
    render(
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

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('Reading')).toBeInTheDocument();
    expect(within(rows[0]).getByText('input.txt').tagName).toBe('CODE');
    expect(within(rows[1]).getByText('Read')).toBeInTheDocument();
    expect(within(rows[1]).getByText('problem.md').tagName).toBe('CODE');
    expect(within(rows[2]).getByText('Editing')).toBeInTheDocument();
    expect(within(rows[2]).getByText('generator.py').tagName).toBe('CODE');
    expect(within(rows[3]).getByText('Edited')).toBeInTheDocument();
    expect(within(rows[3]).getByText('solution.cpp').tagName).toBe('CODE');
  });

  it('uses a spinner for every running tool', () => {
    render(
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

    expect(screen.getAllByRole('img', { name: 'Running' })).toHaveLength(3);
  });

  it('expands and collapses Shell commands from details and summaries', async () => {
    const user = userEvent.setup();
    render(
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

    const runningTrigger = screen.getByRole('button', {
      name: 'Running python3',
    });
    const completedTrigger = screen.getByRole('button', {
      name: 'Ran python3',
    });

    expect(screen.queryByText('python3 running.py')).toBeNull();
    await user.click(runningTrigger);
    expect(screen.getByText('python3 running.py').tagName).toBe('CODE');

    expect(screen.queryByText('python3 generator.py')).toBeNull();
    await user.click(completedTrigger);
    expect(screen.getByText('python3 generator.py').tagName).toBe('CODE');
    await user.click(completedTrigger);
    expect(screen.queryByText('python3 generator.py')).toBeNull();
  });

  it('labels Shell commands with parsed command names', () => {
    render(
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

    expect(
      screen.getByRole('button', { name: 'Ran find, sort, sed (3 commands)' })
    ).toBeInTheDocument();
    expect(screen.getByText('find').tagName).toBe('CODE');
    expect(screen.getByText('sort').tagName).toBe('CODE');
    expect(screen.getByText('sed').tagName).toBe('CODE');
    expect(
      screen.getByRole('button', { name: 'Ran a, b, c, d, e (6 commands)' })
    ).toBeInTheDocument();
    expect(screen.queryByText('f')).toBeNull();
  });

  it('falls back to summaries and omits missing tool values', () => {
    const { container } = render(
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

    expect(screen.getByText('fallback.md').tagName).toBe('CODE');
    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ran Command' })).toBeNull();
    expect(screen.getByText('Ran Command')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('undefined');
  });

  it('renders the English empty state and plain-text fallback', () => {
    const { rerender } = render(<AiGenerationTimeline events={[]} />);

    expect(screen.getByText('Run timeline')).toBeInTheDocument();
    expect(
      screen.getByText('No trace events have been recorded yet.')
    ).toBeInTheDocument();

    rerender(
      <AiGenerationTimeline
        events={[
          {
            testcase: { ...makeTestcase(7, 8), time: 42 },
            parsed: { kind: 'text', text: 'legacy trace text' },
          },
        ]}
      />
    );

    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('legacy trace text')).toBeInTheDocument();
  });

  it('translates event and tool labels', () => {
    testingLibraryRender(
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

    expect(screen.getByText('执行时间线')).toBeInTheDocument();
    expect(screen.getByText('生成测试数据')).toBeInTheDocument();
    expect(screen.getByText('已读取')).toBeInTheDocument();
    expect(screen.getByText('problem.md').tagName).toBe('CODE');
    expect(screen.getByRole('img', { name: '已完成' })).toBeInTheDocument();
  });
});
