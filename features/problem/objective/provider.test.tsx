import { clearDraft, getDraft, saveDraft } from './draft-storage';
import ObjectiveProvider, { useObjective } from './provider';
import type { ObjectiveQuestion } from './question-schema';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function renderProvider(isReadOnly: boolean) {
  return render(
    <ObjectiveProvider draftId="d1" isReadOnly={isReadOnly}>
      <Registrar questions={QUESTIONS} />
      <AnswersView />
      <Controls />
    </ObjectiveProvider>
  );
}

describe('ObjectiveProvider draft validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The provider only checks IndexedDB availability; storage is mocked.
    vi.stubGlobal('indexedDB', {});
  });

  it('discards stale and incompatible entries from stored drafts', async () => {
    mockedGetDraft.mockResolvedValue({
      '1': 'ok',
      '2': ['A'], // question 2 is an input now, array is incompatible
      '3': ['A', 'X'], // X is not an allowed option anymore
      '99': 'stale', // question 99 was removed
    });
    renderProvider(false);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        JSON.stringify({ '1': 'ok', '3': ['A'] })
      )
    );
    await waitFor(() =>
      expect(mockedSaveDraft).toHaveBeenCalledWith('d1', {
        '1': 'ok',
        '3': ['A'],
      })
    );
  });

  it('restores valid drafts untouched', async () => {
    mockedGetDraft.mockResolvedValue({ '1': 'ok', '3': ['A', 'B'] });
    renderProvider(false);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        JSON.stringify({ '1': 'ok', '3': ['A', 'B'] })
      )
    );
    expect(mockedSaveDraft).not.toHaveBeenCalled();
  });
});

describe('ObjectiveProvider clearAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('indexedDB', {});
  });

  it('lets writable users clear answers from state and storage', async () => {
    mockedGetDraft.mockResolvedValue({ '1': 'a' });
    renderProvider(false);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{"1":"a"}')
    );
    await userEvent.click(screen.getByText('clear'));
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{}')
    );
    expect(mockedClearDraft).toHaveBeenCalledWith('d1');
    await waitFor(() => expect(mockedSaveDraft).toHaveBeenCalledWith('d1', {}));
  });

  it('prevents read-only users from mutating state or storage', async () => {
    mockedGetDraft.mockResolvedValue({ '1': 'a' });
    renderProvider(true);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{"1":"a"}')
    );
    await userEvent.click(screen.getByText('set'));
    await userEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('answers')).toHaveTextContent('{"1":"a"}');
    expect(mockedClearDraft).not.toHaveBeenCalled();
    expect(mockedSaveDraft).not.toHaveBeenCalled();
  });
});
