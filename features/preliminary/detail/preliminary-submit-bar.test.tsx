import PreliminarySubmitBar from './preliminary-submit-bar';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  answersState: {
    answers: {},
    answeredCount: 0,
    totalCount: 2,
    clearAnswers: vi.fn(),
    isReady: true,
    draftError: false,
  },
  submit: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Preliminary: {
      submitPreliminary: () => ({
        send: () => mocks.submit(),
      }),
    },
  },
}));
vi.mock('@/features/preliminary/detail/preliminary-answer-provider', () => ({
  usePreliminaryAnswers: () => mocks.answersState,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

function renderBar() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PreliminarySubmitBar
        paperId="paper1"
        revision={1}
        draftId="draft1"
        canSubmit
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.answersState.answers = {};
  mocks.answersState.answeredCount = 0;
  mocks.answersState.totalCount = 2;
  mocks.answersState.isReady = true;
  mocks.answersState.draftError = false;
});

describe('PreliminarySubmitBar old-browser warning', () => {
  it('warns when draft storage is unavailable', () => {
    mocks.answersState.draftError = true;
    renderBar();
    expect(
      screen.getByText(messages.preliminary.draftError)
    ).toBeInTheDocument();
  });

  it('stays quiet when drafts save normally', () => {
    renderBar();
    expect(
      screen.queryByText(messages.preliminary.draftError)
    ).not.toBeInTheDocument();
  });

  it('waits until answers are ready before warning', () => {
    mocks.answersState.isReady = false;
    mocks.answersState.draftError = true;
    renderBar();
    expect(
      screen.queryByText(messages.preliminary.draftError)
    ).not.toBeInTheDocument();
  });
});
