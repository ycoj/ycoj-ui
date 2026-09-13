import SolutionReviewActions from './solution-review-actions';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  review: vi.fn(),
  unblock: vi.fn(),
  send: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Problem: {
      reviewProblemSolution: (...args: unknown[]) => {
        mocks.review(...args);
        return { send: mocks.send };
      },
      unblockSolutionAuthor: (...args: unknown[]) => {
        mocks.unblock(...args);
        return { send: mocks.send };
      },
    },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

function mount(
  target: Parameters<typeof SolutionReviewActions>[0]['target'] = {
    kind: 'solution',
    psid: 'solution-id',
    revision: 7,
  }
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SolutionReviewActions target={target} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => vi.resetAllMocks());

describe('solution review actions', () => {
  it.each([
    ['Feature solution', 3],
    ['Approve', 2],
    ['Reject', 0],
  ] as const)(
    'submits %s with the reviewed revision and advances only on success',
    async (name, status) => {
      mocks.send.mockResolvedValue({ psdoc: { docId: 'solution-id' } });
      mount();
      await userEvent.click(screen.getByRole('button', { name }));
      expect(mocks.review).toHaveBeenCalledWith('solution-id', 7, status);
      await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  );

  it('requires confirmation before blocking every solution by an author', async () => {
    mocks.send.mockResolvedValue({ psdoc: { docId: 'solution-id' } });
    mount();
    await userEvent.click(screen.getByRole('button', { name: 'Block author' }));
    expect(
      screen.getByText(messages.solution.review.blockConsequences)
    ).toBeVisible();
    expect(mocks.review).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.review).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Block author' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm block' })
    );
    expect(mocks.review).toHaveBeenCalledWith('solution-id', 7, -1);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('requires an explicit reload after a conflict without resubmitting the decision', async () => {
    mocks.send.mockResolvedValue({
      error: { name: 'SolutionReviewConflictError', message: 'conflict' },
    });
    mount();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.solution.errors.conflict
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Reload review queue' })
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.review).toHaveBeenCalledOnce();
  });

  it.each([
    ['SolutionReviewBusyError', messages.solution.errors.busy],
    ['SolutionSubmissionBlockedError', messages.solution.errors.blocked],
    ['PermissionError', 'Permission denied'],
  ])('keeps the queue on %s', async (name, message) => {
    mocks.send.mockResolvedValue({
      error: { name, message: 'Permission denied' },
    });
    mount();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('disables all decisions during a request and shows network failures', async () => {
    let reject: (error: Error) => void = () => {};
    mocks.send.mockImplementation(
      () =>
        new Promise((_, rejectPromise) => {
          reject = rejectPromise;
        })
    );
    mount();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    for (const name of [
      'Approve',
      'Reject',
      'Feature solution',
      'Block author',
      'Reload review queue',
    ]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    reject(new Error('Network unavailable'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network unavailable'
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
  });

  it('unblocks by author ID and reloads the next author', async () => {
    mocks.send.mockResolvedValue({});
    mount({ kind: 'author', uid: 42 });
    await userEvent.click(
      screen.getByRole('button', { name: 'Unblock author' })
    );
    expect(mocks.unblock).toHaveBeenCalledWith(42);
    expect(mocks.review).not.toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('allows reloading an empty queue without offering decisions', async () => {
    mount(null);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(
      screen.getByRole('button', { name: 'Reload review queue' })
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
