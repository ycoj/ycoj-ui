import ProblemListEditor, { problemListDragType } from './problem-list-editor';
import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

function searchInput() {
  return page.getByRole('combobox', { name: 'Search problems' });
}

beforeEach(() => {
  mocks.searchProblems.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

test('problemListDragType is unique per list id so sections cannot accept each other', () => {
  expect(problemListDragType('sections.0.pids')).not.toBe(
    problemListDragType('sections.1.pids')
  );
  expect(problemListDragType('sections.0.pids')).toBe(
    'problem-list-item:sections.0.pids'
  );
});

test('adds a selected problem and ignores duplicates', async () => {
  mocks.searchProblems.mockReturnValue({
    send: vi.fn().mockResolvedValue({ pdocs: [tree] }),
  });
  await render(<Harness />);

  const input = searchInput();
  await userEvent.type(input, 'tree');
  const option = page.getByRole('option', { name: /P1000 Binary Tree/ });
  await expect.element(option).toBeVisible();
  await userEvent.click(option);

  await expect
    .element(page.getByText('P1000. Binary Tree', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('A', { exact: true })).toBeVisible();

  await userEvent.type(input, 'tree');
  const optionAgain = page.getByRole('option', { name: /P1000 Binary Tree/ });
  await expect.element(optionAgain).toBeVisible();
  await userEvent.click(optionAgain);

  await expect
    .poll(
      () =>
        page.getByText('P1000. Binary Tree', { exact: true }).elements().length
    )
    .toBe(1);
});

test('removes a problem from the list', async () => {
  await render(<Harness initialValue={[tree, graph]} />);

  await userEvent.click(
    page.getByRole('button', { name: 'Remove P1000. Binary Tree' })
  );

  await expect
    .element(page.getByText('P1000. Binary Tree', { exact: true }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByText('P1001. Graph', { exact: true }))
    .toBeVisible();
  await expect.element(page.getByText('A', { exact: true })).toBeVisible();
});

test('reorders problems with keyboard-accessible move controls', async () => {
  const { container } = await render(<Harness initialValue={[tree, graph]} />);

  const moveUp = page.getByRole('button', {
    name: 'Move P1000. Binary Tree up',
  });
  const moveDownGraph = page.getByRole('button', {
    name: 'Move P1001. Graph down',
  });
  await expect.element(moveUp).toBeDisabled();
  await expect.element(moveDownGraph).toBeDisabled();

  const orderText = () =>
    Array.from(container.querySelector('.divide-y')?.children ?? []).map(
      (item) => item.textContent ?? ''
    );

  const indexOf = (text: string) =>
    orderText().findIndex((entry) => entry.includes(text));

  await userEvent.click(
    page.getByRole('button', { name: 'Move P1000. Binary Tree down' })
  );
  await expect
    .poll(() => indexOf('P1001. Graph') < indexOf('P1000. Binary Tree'))
    .toBe(true);

  await userEvent.click(
    page.getByRole('button', { name: 'Move P1000. Binary Tree up' })
  );
  await expect
    .poll(() => indexOf('P1000. Binary Tree') < indexOf('P1001. Graph'))
    .toBe(true);
});
