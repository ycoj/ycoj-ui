import ProblemListEditor, { problemListDragType } from './problem-list-editor';
import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchProblems: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { searchProblems: mocks.searchProblems } },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const tree: ProblemAutoCompleteItem = {
  docId: 1000,
  pid: 'P1000',
  title: 'Binary Tree',
};
const graph: ProblemAutoCompleteItem = {
  docId: 1001,
  pid: 'P1001',
  title: 'Graph',
};

function Harness({
  initialValue = [],
}: {
  initialValue?: ProblemAutoCompleteItem[];
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProblemListEditor
        domainId="system"
        value={value}
        onValueChange={setValue}
      />
    </NextIntlClientProvider>
  );
}

async function advanceDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('problemListDragType', () => {
  it('is unique per list id so sections cannot accept each other', () => {
    expect(problemListDragType('sections.0.pids')).not.toBe(
      problemListDragType('sections.1.pids')
    );
    expect(problemListDragType('sections.0.pids')).toBe(
      'problem-list-item:sections.0.pids'
    );
  });
});

describe('ProblemListEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.searchProblems.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a selected problem and ignores duplicates', async () => {
    mocks.searchProblems.mockReturnValue({
      send: vi.fn().mockResolvedValue({ pdocs: [tree] }),
    });
    render(<Harness />);

    const input = screen.getByRole('combobox', { name: 'Search problems' });
    fireEvent.change(input, { target: { value: 'tree' } });
    await advanceDebounce();
    fireEvent.click(screen.getByText('P1000 Binary Tree'));

    expect(screen.getByText('P1000. Binary Tree')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'tree' } });
    await advanceDebounce();
    fireEvent.click(screen.getByText('P1000 Binary Tree'));

    expect(screen.getAllByText('P1000. Binary Tree')).toHaveLength(1);
  });

  it('removes a problem from the list', () => {
    render(<Harness initialValue={[tree, graph]} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove P1000. Binary Tree' })
    );

    expect(screen.queryByText('P1000. Binary Tree')).toBeNull();
    expect(screen.getByText('P1001. Graph')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('reorders problems with keyboard-accessible move controls', () => {
    render(<Harness initialValue={[tree, graph]} />);

    expect(
      screen.getByRole('button', { name: 'Move P1000. Binary Tree up' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Move P1001. Graph down' })
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move P1000. Binary Tree down' })
    );

    expect(screen.getByText('A').parentElement).toHaveTextContent(
      'P1001. Graph'
    );
    expect(screen.getByText('B').parentElement).toHaveTextContent(
      'P1000. Binary Tree'
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Move P1000. Binary Tree up' })
    );

    expect(screen.getByText('A').parentElement).toHaveTextContent(
      'P1000. Binary Tree'
    );
    expect(screen.getByText('B').parentElement).toHaveTextContent(
      'P1001. Graph'
    );
  });
});
