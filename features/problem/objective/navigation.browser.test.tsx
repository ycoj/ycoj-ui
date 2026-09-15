import { clearDraft, getDraft } from './draft-storage';
import ObjectiveNavigation from './navigation';
import ObjectiveProvider, { useObjective } from './provider';
import type { ObjectiveQuestion } from './question-schema';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { useEffect } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('./draft-storage', () => ({
  getDraft: vi.fn(() => Promise.resolve(null)),
  saveDraft: vi.fn(() => Promise.resolve()),
  clearDraft: vi.fn(() => Promise.resolve()),
}));

const mockedGetDraft = vi.mocked(getDraft);
const mockedClearDraft = vi.mocked(clearDraft);

const QUESTIONS: ObjectiveQuestion[] = [{ id: '1', type: 'input' }];

function Registrar({ questions }: { questions: ObjectiveQuestion[] }) {
  const { registerQuestion } = useObjective();
  useEffect(() => {
    const cleanups = questions.map((q) => registerQuestion(q));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [questions, registerQuestion]);
  return null;
}

function renderNavigation(isReadOnly: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ObjectiveProvider draftId="d1" isReadOnly={isReadOnly}>
        <Registrar questions={QUESTIONS} />
        <ObjectiveNavigation />
      </ObjectiveProvider>
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('indexedDB', {});
});

test('shows Clear answers for writable users and clears the draft after confirming', async () => {
  await renderNavigation(false);

  const clearButton = page.getByText('Clear answers', { exact: true });
  await expect.element(clearButton).toBeVisible();
  await userEvent.click(clearButton);
  expect(mockedClearDraft).not.toHaveBeenCalled();

  const dialog = page.getByRole('alertdialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(
    dialog.getByRole('button', { name: 'Clear answers', exact: true })
  );
  await expect.poll(() => mockedClearDraft.mock.calls.length).toBe(1);
  expect(mockedClearDraft).toHaveBeenCalledWith('d1');
});

test('hides Clear answers for read-only users but keeps navigation', async () => {
  await renderNavigation(true);

  await expect.element(page.getByText('1', { exact: true })).toBeVisible();
  await expect
    .element(page.getByText('Clear answers', { exact: true }))
    .not.toBeInTheDocument();
});

test('keeps the draft warning visible for read-only users', async () => {
  mockedGetDraft.mockRejectedValueOnce(new Error('idb unavailable'));
  await renderNavigation(true);

  await expect
    .element(
      page.getByText(
        'Draft storage unavailable, answers will not be persisted',
        { exact: true }
      )
    )
    .toBeVisible();
  await expect
    .element(page.getByText('Clear answers', { exact: true }))
    .not.toBeInTheDocument();
});

test('does not clear when the user cancels the confirmation', async () => {
  await renderNavigation(false);

  await userEvent.click(page.getByText('Clear answers', { exact: true }));
  const dialog = page.getByRole('alertdialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await expect.element(dialog).not.toBeInTheDocument();
  expect(mockedClearDraft).not.toHaveBeenCalled();
});
