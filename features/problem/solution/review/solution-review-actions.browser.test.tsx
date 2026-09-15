import SolutionReviewActions from './solution-review-actions';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
  },
  showReload = true
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SolutionReviewActions target={target} showReload={showReload} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => vi.resetAllMocks());

test.each([
  ['Feature solution', 3],
  ['Approve', 2],
  ['Reject', 0],
] as const)(
  'submits %s with the reviewed revision and advances only on success',
  async (name, status) => {
    mocks.send.mockResolvedValue({ psdoc: { docId: 'solution-id' } });
    await mount();

    const button = page.getByRole('button', { name });
    await userEvent.click(button);
    expect(mocks.review).toHaveBeenCalledWith('solution-id', 7, status);
    await expect.poll(() => mocks.refresh.mock.calls.length).toBe(1);
    await expect.element(button).toBeDisabled();
  }
);

test('requires confirmation before blocking every solution by an author', async () => {
  mocks.send.mockResolvedValue({ psdoc: { docId: 'solution-id' } });
  await mount();

  await userEvent.click(page.getByRole('button', { name: 'Block author' }));
  await expect
    .element(
      page.getByText(messages.solution.review.blockConsequences, {
        exact: true,
      })
    )
    .toBeVisible();
  expect(mocks.review).not.toHaveBeenCalled();

  await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
  expect(mocks.review).not.toHaveBeenCalled();

  await userEvent.click(page.getByRole('button', { name: 'Block author' }));
  await userEvent.click(page.getByRole('button', { name: 'Confirm block' }));
  expect(mocks.review).toHaveBeenCalledWith('solution-id', 7, -1);
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test('requires an explicit reload after a conflict without resubmitting the decision', async () => {
  mocks.send.mockResolvedValue({
    error: { name: 'SolutionReviewConflictError', message: 'conflict' },
  });
  await mount();

  await userEvent.click(page.getByRole('button', { name: 'Approve' }));
  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent(messages.solution.errors.conflict);
  expect(mocks.refresh).not.toHaveBeenCalled();
  await expect
    .element(page.getByRole('button', { name: 'Approve' }))
    .toBeDisabled();

  await userEvent.click(
    page.getByRole('button', { name: 'Reload review queue' })
  );
  expect(mocks.refresh).toHaveBeenCalledOnce();
  expect(mocks.review).toHaveBeenCalledOnce();
});

test.each([
  ['SolutionReviewBusyError', messages.solution.errors.busy],
  ['SolutionSubmissionBlockedError', messages.solution.errors.blocked],
  ['PermissionError', 'Permission denied'],
])('keeps the queue on %s', async (name, message) => {
  mocks.send.mockResolvedValue({
    error: { name, message: 'Permission denied' },
  });
  await mount();

  await userEvent.click(page.getByRole('button', { name: 'Approve' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent(message);
  expect(mocks.refresh).not.toHaveBeenCalled();
});

test('disables all decisions during a request and shows network failures', async () => {
  let reject: (error: Error) => void = () => {};
  mocks.send.mockImplementation(
    () =>
      new Promise((_, rejectPromise) => {
        reject = rejectPromise;
      })
  );
  await mount();

  await userEvent.click(page.getByRole('button', { name: 'Approve' }));
  for (const name of [
    'Approve',
    'Reject',
    'Feature solution',
    'Block author',
    'Reload review queue',
  ]) {
    await expect.element(page.getByRole('button', { name })).toBeDisabled();
  }

  reject(new Error('Network unavailable'));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Network unavailable');
  expect(mocks.refresh).not.toHaveBeenCalled();
  await expect
    .element(page.getByRole('button', { name: 'Approve' }))
    .toBeEnabled();
});

test('unblocks by author ID and reloads the next author', async () => {
  mocks.send.mockResolvedValue({});
  await mount({ kind: 'author', uid: 42 });

  await userEvent.click(page.getByRole('button', { name: 'Unblock author' }));

  expect(mocks.unblock).toHaveBeenCalledWith(42);
  expect(mocks.review).not.toHaveBeenCalled();
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test('allows reloading an empty queue without offering decisions', async () => {
  await mount(null);

  await expect.poll(() => page.getByRole('button').elements().length).toBe(1);
  await userEvent.click(
    page.getByRole('button', { name: 'Reload review queue' })
  );
  expect(mocks.refresh).toHaveBeenCalledOnce();
  expect(mocks.send).not.toHaveBeenCalled();
});

test('hides its reload control when the surrounding view already has one', async () => {
  await mount({ kind: 'author', uid: 42 }, false);

  await expect
    .element(page.getByRole('button', { name: 'Unblock author' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Reload review queue' }))
    .not.toBeInTheDocument();
});
