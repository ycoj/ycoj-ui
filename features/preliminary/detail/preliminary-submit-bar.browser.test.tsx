import PreliminarySubmitBar from './preliminary-submit-bar';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  answersState: {
    answers: {} as Record<string, string>,
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

function submitButton() {
  return page.getByRole('button', { name: messages.preliminary.submit });
}

function clearButton() {
  return page.getByRole('button', { name: messages.preliminary.clearAnswers });
}

beforeEach(async () => {
  // The submit bar is a mobile-only layout (`md:hidden`).
  await page.viewport(480, 720);
  vi.clearAllMocks();
  mocks.answersState.answers = {};
  mocks.answersState.answeredCount = 0;
  mocks.answersState.totalCount = 2;
  mocks.answersState.isReady = true;
  mocks.answersState.draftError = false;
});

test('warns when draft storage is unavailable', async () => {
  mocks.answersState.draftError = true;
  await renderBar();

  await expect
    .element(page.getByText(messages.preliminary.draftError, { exact: true }))
    .toBeVisible();
});

test('stays quiet when drafts save normally', async () => {
  await renderBar();

  await expect
    .element(page.getByText(messages.preliminary.draftError, { exact: true }))
    .not.toBeInTheDocument();
});

test('waits until answers are ready before warning', async () => {
  mocks.answersState.isReady = false;
  mocks.answersState.draftError = true;
  await renderBar();

  await expect
    .element(page.getByText(messages.preliminary.draftError, { exact: true }))
    .not.toBeInTheDocument();
});

test('keeps navigation available without submission or clearing in read-only mode', async () => {
  await renderBar(false);

  await expect
    .element(page.getByRole('button', { name: 'Question navigation' }))
    .toBeEnabled();
  await expect.element(submitButton()).not.toBeInTheDocument();
  await expect.element(clearButton()).not.toBeInTheDocument();
});

test('disables answer actions until the draft has loaded', async () => {
  mocks.answersState.isReady = false;
  await renderBar();

  await expect.element(submitButton()).toBeDisabled();
  await expect.element(clearButton()).toBeDisabled();
});

test('clears answers only after confirming in the dialog', async () => {
  await renderBar();

  await userEvent.click(clearButton());
  expect(mocks.answersState.clearAnswers).not.toHaveBeenCalled();

  const dialog = page.getByRole('alertdialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(
    dialog.getByRole('button', {
      name: messages.preliminary.clearAnswers,
    })
  );

  await expect
    .poll(() => mocks.answersState.clearAnswers.mock.calls.length)
    .toBe(1);
});

test('keeps answers when the dialog is cancelled', async () => {
  await renderBar();

  await userEvent.click(clearButton());
  const dialog = page.getByRole('alertdialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(
    dialog.getByRole('button', { name: messages.common.cancel })
  );

  await expect.element(dialog).not.toBeInTheDocument();
  expect(mocks.answersState.clearAnswers).not.toHaveBeenCalled();
});

test('clears answers through the provider after a successful submit', async () => {
  mocks.answersState.answers = { q1: 'o1' };
  mocks.submit.mockResolvedValue({ url: '/preliminary/paper1/attempt/a1' });
  await renderBar();

  await userEvent.click(submitButton());

  await expect.poll(() => mocks.submit.mock.calls.length).toBe(1);
  await expect
    .poll(() => mocks.answersState.clearAnswers.mock.calls.length)
    .toBe(1);
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/preliminary/paper1/attempt/a1');
});

test('shows the translated message when submission fails', async () => {
  mocks.submit.mockResolvedValue({ error: { message: 'denied' } });
  await renderBar();

  await userEvent.click(submitButton());

  await expect
    .element(page.getByText(messages.preliminary.submitFailed, { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('PreliminaryRequestFailed', { exact: true }))
    .not.toBeInTheDocument();
  expect(mocks.push).not.toHaveBeenCalled();
});

test('shows backend copy as-is instead of mistranslating it', async () => {
  mocks.submit.mockRejectedValue(new Error('submitFailed'));
  await renderBar();

  await userEvent.click(submitButton());

  await expect
    .element(page.getByText('submitFailed', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText(messages.preliminary.submitFailed, { exact: true }))
    .not.toBeInTheDocument();
  expect(mocks.push).not.toHaveBeenCalled();
});
