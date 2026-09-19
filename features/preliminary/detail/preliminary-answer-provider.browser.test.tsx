import PreliminaryAnswerProvider, {
  sanitizeDraft,
  sanitizeProgrammingDraft,
  usePreliminaryAnswers,
} from './preliminary-answer-provider';
import type {
  PreliminaryAnswers,
  PreliminaryProgrammingAnswers,
} from '@/shared/types/preliminary';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const makeOps = () => ({
    getDraft: vi.fn(),
    saveDraft: vi.fn(() => Promise.resolve()),
    clearDraft: vi.fn(() => Promise.resolve()),
  });
  // The provider creates one storage per answer map, in declaration order:
  // objective answers first, then the programming map.
  const objective = makeOps();
  const programming = makeOps();
  let callCount = 0;
  return {
    objective,
    programming,
    nextStorage: () => (callCount++ === 0 ? objective : programming),
  };
});
vi.mock('@/shared/lib/indexeddb-draft', () => ({
  DRAFT_DATABASES: {
    preliminary: { dbName: 'test-db', storeName: 'test-store' },
  },
  makeDraftStorage: () => mocks.nextStorage(),
}));

const mockedGetDraft = mocks.objective.getDraft;
const mockedSaveDraft = mocks.objective.saveDraft;
const mockedClearDraft = mocks.objective.clearDraft;
const mockedGetProgrammingDraft = mocks.programming.getDraft;
const mockedSaveProgrammingDraft = mocks.programming.saveDraft;
const mockedClearProgrammingDraft = mocks.programming.clearDraft;

const ALLOWED = { q1: ['o1', 'o2'], q2: ['true', 'false'] };
const PROGRAMMING_IDS = ['p1'];

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

  it('returns the input when nothing changed', () => {
    const stored = { q1: 'o1', q2: 'false' };
    expect(sanitizeDraft(stored, ALLOWED)).toBe(stored);
  });

  it('returns a new object when entries are dropped', () => {
    const stored = { q1: 'o1', gone: 'x' };
    const sanitized = sanitizeDraft(stored, ALLOWED);
    expect(sanitized).toEqual({ q1: 'o1' });
    expect(sanitized).not.toBe(stored);
  });
});

describe('sanitizeProgrammingDraft', () => {
  it.each<{
    name: string;
    stored: Record<string, unknown>;
    expected: Record<string, unknown>;
  }>([
    {
      name: 'keeps typed answers for known questions',
      stored: { p1: { lang: 'cpp', code: 'int main() {}' } },
      expected: { p1: { lang: 'cpp', code: 'int main() {}' } },
    },
    {
      name: 'drops answers for removed questions',
      stored: {
        p1: { lang: 'cpp', code: 'x' },
        gone: { lang: 'cpp', code: 'x' },
      },
      expected: { p1: { lang: 'cpp', code: 'x' } },
    },
    {
      name: 'drops legacy JSON-smuggled strings',
      stored: { p1: '{"lang":"cpp","code":"x"}' },
      expected: {},
    },
    {
      name: 'drops malformed entries',
      stored: { p1: { lang: 'cpp' }, p2: null },
      expected: {},
    },
    {
      name: 'returns empty for an empty draft',
      stored: {},
      expected: {},
    },
  ])('$name', ({ stored, expected }) => {
    expect(
      sanitizeProgrammingDraft(
        stored as PreliminaryProgrammingAnswers,
        PROGRAMMING_IDS
      )
    ).toEqual(expected);
  });

  it('returns the input when nothing changed', () => {
    const stored = { p1: { lang: 'cpp', code: 'x' } };
    expect(sanitizeProgrammingDraft(stored, PROGRAMMING_IDS)).toBe(stored);
  });
});

function AnswersView() {
  const { answers, programmingAnswers, isReady } = usePreliminaryAnswers();
  return (
    <div data-testid="answers">
      {isReady ? JSON.stringify({ answers, programmingAnswers }) : 'loading'}
    </div>
  );
}

function Controls() {
  const { setAnswer, setProgrammingAnswer, clearAnswers } =
    usePreliminaryAnswers();
  return (
    <>
      <button onClick={() => setAnswer('q1', 'o2')}>set</button>
      <button
        onClick={() =>
          setProgrammingAnswer('p1', { lang: 'cpp', code: 'int main() {}' })
        }
      >
        set-programming
      </button>
      <button onClick={() => void clearAnswers()}>clear</button>
    </>
  );
}

function renderProvider(isReadOnly: boolean) {
  return render(
    <PreliminaryAnswerProvider
      draftId="d1"
      allowedAnswers={ALLOWED}
      programmingQuestionIds={PROGRAMMING_IDS}
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
      expect(screen.getByTestId('answers')).toHaveTextContent(
        '{"answers":{"q1":"o1"},"programmingAnswers":{}}'
      )
    );
    await userEvent.click(screen.getByText('set'));
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        '{"answers":{"q1":"o2"},"programmingAnswers":{}}'
      )
    );
    await userEvent.click(screen.getByText('clear'));
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        '{"answers":{},"programmingAnswers":{}}'
      )
    );
    expect(mockedClearDraft).toHaveBeenCalledWith('d1');
    expect(mockedClearProgrammingDraft).toHaveBeenCalledWith('d1#programming');
  });

  it('prevents read-only users from mutating state or storage', async () => {
    mockedGetDraft.mockResolvedValue({ q1: 'o1' });
    renderProvider(true);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        '{"answers":{"q1":"o1"},"programmingAnswers":{}}'
      )
    );
    await userEvent.click(screen.getByText('set'));
    await userEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('answers')).toHaveTextContent(
      '{"answers":{"q1":"o1"},"programmingAnswers":{}}'
    );
    expect(mockedClearDraft).not.toHaveBeenCalled();
    expect(mockedSaveDraft).not.toHaveBeenCalled();
  });

  it('persists a programming answer and restores it on remount', async () => {
    mockedGetDraft.mockResolvedValue({});
    mockedGetProgrammingDraft.mockResolvedValue({});
    const { unmount } = renderProvider(false);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        '{"answers":{},"programmingAnswers":{}}'
      )
    );

    await userEvent.click(screen.getByText('set-programming'));
    const persisted = { p1: { lang: 'cpp', code: 'int main() {}' } };
    await waitFor(() =>
      expect(mockedSaveProgrammingDraft).toHaveBeenCalledWith(
        'd1#programming',
        expect.objectContaining(persisted)
      )
    );

    // Simulate a page reload: the remounted provider loads the persisted
    // programming map instead of losing it.
    unmount();
    mockedGetProgrammingDraft.mockResolvedValue(persisted);
    renderProvider(false);
    await waitFor(() =>
      expect(screen.getByTestId('answers')).toHaveTextContent(
        '{"answers":{},"programmingAnswers":{"p1":{"lang":"cpp","code":"int main() {}"}}}'
      )
    );
  });
});
