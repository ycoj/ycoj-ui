import { clearDraft, getDraft, saveDraft } from './draft-storage';
import ObjectiveProvider, { useObjective } from './provider';
import type { ObjectiveQuestion } from './question-schema';
import { useEffect } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('./draft-storage', () => ({
  getDraft: vi.fn(),
  saveDraft: vi.fn(() => Promise.resolve()),
  clearDraft: vi.fn(() => Promise.resolve()),
}));

const mockedGetDraft = vi.mocked(getDraft);
const mockedSaveDraft = vi.mocked(saveDraft);
const mockedClearDraft = vi.mocked(clearDraft);

const QUESTIONS: ObjectiveQuestion[] = [
  { id: '1', type: 'input' },
  { id: '2', type: 'input' },
  { id: '3', type: 'multiselect', options: ['A', 'B'] },
];

function Registrar({ questions }: { questions: ObjectiveQuestion[] }) {
  const { registerQuestion } = useObjective();
  useEffect(() => {
    const cleanups = questions.map((q) => registerQuestion(q));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [questions, registerQuestion]);
  return null;
}

function AnswersView() {
  const { answers, isReady } = useObjective();
  return (
    <div data-testid="answers">
      {isReady ? JSON.stringify(answers) : 'loading'}
    </div>
  );
}

function Controls() {
  const { setAnswer, clearAnswers } = useObjective();
  return (
    <>
      <button onClick={() => setAnswer('1', 'changed')}>set</button>
      <button onClick={() => void clearAnswers()}>clear</button>
    </>
  );
}

// Persistence runs in effects that commit right after each render, so once
// the visible state settles a real frame is enough for any wrongly scheduled
// save or clear to land before asserting that none did.
async function settlePersistence() {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

function renderProvider(isReadOnly: boolean) {
  return render(
    <ObjectiveProvider draftId="d1" isReadOnly={isReadOnly}>
      <Registrar questions={QUESTIONS} />
      <AnswersView />
      <Controls />
    </ObjectiveProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('discards stale and incompatible entries from stored drafts', async () => {
  mockedGetDraft.mockResolvedValue({
    '1': 'ok',
    '2': ['A'],
    '3': ['A', 'X'],
    '99': 'stale',
  });
  renderProvider(false);

  const answers = page.getByTestId('answers');
  await expect
    .element(answers)
    .toHaveTextContent(JSON.stringify({ '1': 'ok', '3': ['A'] }));
  await expect.poll(() => mockedSaveDraft.mock.calls.length).toBeGreaterThan(0);
  expect(mockedSaveDraft).toHaveBeenCalledWith('d1', {
    '1': 'ok',
    '3': ['A'],
  });
});

test('restores valid drafts untouched', async () => {
  mockedGetDraft.mockResolvedValue({ '1': 'ok', '3': ['A', 'B'] });
  renderProvider(false);

  await expect
    .element(page.getByTestId('answers'))
    .toHaveTextContent(JSON.stringify({ '1': 'ok', '3': ['A', 'B'] }));
  expect(mockedSaveDraft).not.toHaveBeenCalled();
});

test('lets writable users clear answers from state and storage', async () => {
  mockedGetDraft.mockResolvedValue({ '1': 'a' });
  renderProvider(false);

  const answers = page.getByTestId('answers');
  await expect.element(answers).toHaveTextContent('{"1":"a"}');

  await userEvent.click(page.getByText('clear', { exact: true }));
  await expect.element(answers).toHaveTextContent('{}');
  await expect.poll(() => mockedClearDraft.mock.calls.length).toBe(1);
  expect(mockedClearDraft).toHaveBeenCalledWith('d1');
  await settlePersistence();
  expect(mockedSaveDraft).not.toHaveBeenCalledWith('d1', {});
});

test('prevents read-only users from mutating state or storage', async () => {
  mockedGetDraft.mockResolvedValue({ '1': 'a' });
  renderProvider(true);

  const answers = page.getByTestId('answers');
  await expect.element(answers).toHaveTextContent('{"1":"a"}');

  await userEvent.click(page.getByText('set', { exact: true }));
  await userEvent.click(page.getByText('clear', { exact: true }));

  await expect.element(answers).toHaveTextContent('{"1":"a"}');
  expect(mockedClearDraft).not.toHaveBeenCalled();
  expect(mockedSaveDraft).not.toHaveBeenCalled();
});

test('does not delete a draft loaded before questions register', async () => {
  mockedGetDraft.mockResolvedValue({ '1': 'ok' });
  const { rerender } = await render(
    <ObjectiveProvider draftId="d1" isReadOnly={false}>
      <AnswersView />
    </ObjectiveProvider>
  );

  await expect.element(page.getByTestId('answers')).toHaveTextContent('{}');
  await settlePersistence();
  expect(mockedClearDraft).not.toHaveBeenCalled();
  expect(mockedSaveDraft).not.toHaveBeenCalled();

  await rerender(
    <ObjectiveProvider draftId="d1" isReadOnly={false}>
      <Registrar questions={QUESTIONS} />
      <AnswersView />
      <Controls />
    </ObjectiveProvider>
  );
  await expect
    .element(page.getByTestId('answers'))
    .toHaveTextContent('{"1":"ok"}');
  await settlePersistence();
  expect(mockedClearDraft).not.toHaveBeenCalled();
});
