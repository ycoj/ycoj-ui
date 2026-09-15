import PreliminaryAnswerProvider, {
  sanitizeDraft,
  usePreliminaryAnswers,
} from './preliminary-answer-provider';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  getDraft: vi.fn(),
  saveDraft: vi.fn(() => Promise.resolve()),
  clearDraft: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/shared/lib/indexeddb-draft', () => ({
  DRAFT_DATABASES: {
    preliminary: { dbName: 'test-db', storeName: 'test-store' },
  },
  makeDraftStorage: () => ({
    getDraft: mocks.getDraft,
    saveDraft: mocks.saveDraft,
    clearDraft: mocks.clearDraft,
  }),
}));

const mockedGetDraft = mocks.getDraft;
const mockedSaveDraft = mocks.saveDraft;
const mockedClearDraft = mocks.clearDraft;

const ALLOWED = { q1: ['o1', 'o2'], q2: ['true', 'false'] };

test.each<{
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
])('sanitizeDraft $name', ({ stored, expected }) => {
  expect(sanitizeDraft(stored, ALLOWED)).toEqual(expected);
});

test('sanitizeDraft returns the input when nothing changed', () => {
  const stored = { q1: 'o1', q2: 'false' };
  expect(sanitizeDraft(stored, ALLOWED)).toBe(stored);
});

test('sanitizeDraft returns a new object when entries are dropped', () => {
  const stored = { q1: 'o1', gone: 'x' };
  const sanitized = sanitizeDraft(stored, ALLOWED);
  expect(sanitized).toEqual({ q1: 'o1' });
  expect(sanitized).not.toBe(stored);
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

beforeEach(() => {
  vi.clearAllMocks();
});

test('lets writable users set and clear answers', async () => {
  mockedGetDraft.mockResolvedValue({ q1: 'o1' });
  renderProvider(false);

  const answers = page.getByTestId('answers');
  await expect.element(answers).toHaveTextContent('{"q1":"o1"}');

  await userEvent.click(page.getByText('set', { exact: true }));
  await expect.element(answers).toHaveTextContent('{"q1":"o2"}');

  await userEvent.click(page.getByText('clear', { exact: true }));
  await expect.element(answers).toHaveTextContent('{}');
  await expect.poll(() => mockedClearDraft.mock.calls.length).toBe(1);
  expect(mockedClearDraft).toHaveBeenCalledWith('d1');
});

test('prevents read-only users from mutating state or storage', async () => {
  mockedGetDraft.mockResolvedValue({ q1: 'o1' });
  renderProvider(true);

  const answers = page.getByTestId('answers');
  await expect.element(answers).toHaveTextContent('{"q1":"o1"}');

  await userEvent.click(page.getByText('set', { exact: true }));
  await userEvent.click(page.getByText('clear', { exact: true }));

  await expect.element(answers).toHaveTextContent('{"q1":"o1"}');
  expect(mockedClearDraft).not.toHaveBeenCalled();
  expect(mockedSaveDraft).not.toHaveBeenCalled();
});
