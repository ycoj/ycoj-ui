import { clearDraft, getDraft, saveDraft } from './draft-storage';
import PreliminaryAnswerProvider, {
  sanitizeDraft,
  usePreliminaryAnswers,
} from './preliminary-answer-provider';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./draft-storage', () => ({
  getDraft: vi.fn(),
  saveDraft: vi.fn(() => Promise.resolve()),
  clearDraft: vi.fn(() => Promise.resolve()),
}));

const mockedGetDraft = vi.mocked(getDraft);
const mockedSaveDraft = vi.mocked(saveDraft);
const mockedClearDraft = vi.mocked(clearDraft);

const ALLOWED = { q1: ['o1', 'o2'], q2: ['true', 'false'] };

describe('sanitizeDraft', () => {
  it.each<{
    name: string;
    stored: PreliminaryAnswers;
    expected: PreliminaryAnswers;
  }>([
    {
      name: 'keeps values within the allow-list',
      stored: { q1: 'o1', q2: 'false' },
      expected: { q1: 'o1', q2: 'false' },
    },
    {
      name: 'drops answers for removed questions',
      stored: { q1: 'o1', gone: 'x' },
      expected: { q1: 'o1' },
    },
    {
      name: 'drops values that are no longer allowed',
      stored: { q1: 'stale-option', q2: 'maybe' },
      expected: {},
    },
    {
      name: 'keeps the valid subset of a mixed draft',
      stored: { q1: 'o2', q2: 'bogus', gone: 'x' },
      expected: { q1: 'o2' },
    },
    {
      name: 'returns empty for an empty draft',
      stored: {},
      expected: {},
    },
  ])('$name', ({ stored, expected }) => {
    expect(sanitizeDraft(stored, ALLOWED)).toEqual(expected);
  });
});

function AnswersView() {
  const { answers, isReady } = usePreliminaryAnswers();
  return (
    <div data-testid="answers">
      {isReady ? JSON.stringify(answers) : 'loading'}
    </div>
  );
}

function Controls() {
  const { setAnswer, clearAnswers } = usePreliminaryAnswers();
  return (
    <>
      <button onClick={() => setAnswer('q1', 'o2')}>set</button>
      <button onClick={() => void clearAnswers()}>clear</button>
    </>
  );
}

function renderProvider(isReadOnly: boolean) {
  return render(
    <PreliminaryAnswerProvider
      draftId="d1"
      allowedAnswers={ALLOWED}
      isReadOnly={isReadOnly}
    >
      <AnswersView />
      <Controls />
    </PreliminaryAnswerProvider>
  );
}

describe('PreliminaryAnswerProvider readOnly guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The provider only checks IndexedDB availability; storage is mocked.
    vi.stubGlobal('indexedDB', {});
  });

  it('lets writable users set and clear answers', async () => {
    mockedGetDraft.mockResolvedValue({ q1: 'o1' });
    renderProvider(false);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{"q1":"o1"}')
    );
    await userEvent.click(screen.getByText('set'));
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{"q1":"o2"}')
    );
    await userEvent.click(screen.getByText('clear'));
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{}')
    );
    expect(mockedClearDraft).toHaveBeenCalledWith('d1');
  });

  it('prevents read-only users from mutating state or storage', async () => {
    mockedGetDraft.mockResolvedValue({ q1: 'o1' });
    renderProvider(true);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent('{"q1":"o1"}')
    );
    // Ignore the load-time re-save of the restored draft; guards are about
    // user-triggered mutations below.
    mockedSaveDraft.mockClear();
    await userEvent.click(screen.getByText('set'));
    await userEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('answers')).toHaveTextContent('{"q1":"o1"}');
    expect(mockedClearDraft).not.toHaveBeenCalled();
    expect(mockedSaveDraft).not.toHaveBeenCalled();
  });
});
