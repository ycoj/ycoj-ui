import PreliminarySubmitBar from './preliminary-submit-bar';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  answersState: {
    answers: {},
    answeredCount: 0,
    totalCount: 2,
    clearAnswers: vi.fn(() => Promise.resolve()),
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
        canSubmit={canSubmit}
        navigation={<button type="button">Question navigation</button>}
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

describe('PreliminarySubmitBar submit', () => {
  it('clears answers through the provider after a successful submit', async () => {
    const user = userEvent.setup();
    mocks.answersState.answers = { q1: 'o1' };
    mocks.submit.mockResolvedValue({ url: '/preliminary/paper1/attempt/a1' });
    renderBar();
    await user.click(
      screen.getByRole('button', { name: messages.preliminary.submit })
    );
    expect(mocks.submit).toHaveBeenCalled();
    expect(mocks.answersState.clearAnswers).toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/preliminary/paper1/attempt/a1');
  });

  it('shows the translated message when submission fails', async () => {
    const user = userEvent.setup();
    mocks.submit.mockResolvedValue({ error: { message: 'denied' } });
    renderBar();
    await user.click(
      screen.getByRole('button', { name: messages.preliminary.submit })
    );
    expect(
      screen.getByText(messages.preliminary.submitFailed)
    ).toBeInTheDocument();
    expect(
      screen.queryByText('PreliminaryRequestFailed')
    ).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('shows backend copy as-is instead of mistranslating it', async () => {
    const user = userEvent.setup();
    mocks.submit.mockRejectedValue(new Error('submitFailed'));
    renderBar();
    await user.click(
      screen.getByRole('button', { name: messages.preliminary.submit })
    );
    expect(screen.getByText('submitFailed')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.preliminary.submitFailed)
    ).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
