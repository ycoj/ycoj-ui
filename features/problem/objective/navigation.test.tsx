import { clearDraft, getDraft } from './draft-storage';
import ObjectiveNavigation from './navigation';
import ObjectiveProvider, { useObjective } from './provider';
import type { ObjectiveQuestion } from './question-schema';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('ObjectiveNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('indexedDB', {});
  });

  it('shows Clear answers for writable users and clears the draft', async () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    renderNavigation(false);
    const clearButton = await screen.findByText('Clear answers');
    await userEvent.click(clearButton);
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockedClearDraft).toHaveBeenCalledWith('d1');
  });

  it('hides Clear answers for read-only users but keeps navigation', async () => {
    renderNavigation(true);
    await screen.findByText('1');
    expect(screen.queryByText('Clear answers')).not.toBeInTheDocument();
  });

  it('keeps the draft warning visible for read-only users', async () => {
    mockedGetDraft.mockRejectedValueOnce(new Error('idb unavailable'));
    renderNavigation(true);
    await screen.findByText(
      'Draft storage unavailable, answers will not be persisted'
    );
    expect(screen.queryByText('Clear answers')).not.toBeInTheDocument();
  });

  it('does not clear when the user cancels the confirmation', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    );
    renderNavigation(false);
    const clearButton = await screen.findByText('Clear answers');
    await userEvent.click(clearButton);
    await waitFor(() => expect(mockedClearDraft).not.toHaveBeenCalled());
  });
});
