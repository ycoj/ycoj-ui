import PreliminarySubmitBar from './preliminary-submit-bar';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

function renderBar(canSubmit = true) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PreliminarySubmitBar
        paperId="paper1"
        revision={1}
        draftId="draft1"
        canSubmit={canSubmit}
        navigation={<button type="button">Question navigation</button>}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.clearAllMocks();
  mocks.answersState.answers = {};
  mocks.answersState.answeredCount = 0;
  mocks.answersState.totalCount = 2;
  mocks.answersState.isReady = true;
  mocks.answersState.draftError = false;
});

afterEach(() => vi.unstubAllGlobals());

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

describe('PreliminarySubmitBar permissions', () => {
  it('keeps navigation available without submission or clearing in read-only mode', () => {
    renderBar(false);
    expect(
      screen.getByRole('button', { name: 'Question navigation' })
    ).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: messages.preliminary.submit })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: messages.preliminary.clearAnswers })
    ).not.toBeInTheDocument();
  });

  it('disables answer actions until the draft has loaded', () => {
    mocks.answersState.isReady = false;
    renderBar();
    expect(
      screen.getByRole('button', { name: messages.preliminary.submit })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: messages.preliminary.clearAnswers })
    ).toBeDisabled();
  });
});
