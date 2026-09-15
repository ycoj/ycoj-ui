import ContestSolutionDeleteButton from './contest-solution-delete-button';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  send: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      deleteContestSolution: (...args: unknown[]) => {
        mocks.request(...args);
        return { send: mocks.send };
      },
    },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

function mount(node: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

beforeEach(() => vi.resetAllMocks());

test('requires confirmation and keeps the page on backend failure', async () => {
  mocks.send.mockResolvedValue({
    error: { name: 'PermissionError', message: 'Permission denied' },
  });
  await mount(<ContestSolutionDeleteButton tid="contest" sid="solution" />);

  await userEvent.click(page.getByRole('button', { name: 'Delete solution' }));
  expect(mocks.request).not.toHaveBeenCalled();

  const confirm = page.getByRole('button', { name: 'Confirm' });
  await expect.element(confirm).toBeVisible();
  await userEvent.click(confirm);

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  expect(mocks.request).toHaveBeenCalledWith('contest', 'solution');
  expect(mocks.push).not.toHaveBeenCalled();
});

test('returns to the contest after successful deletion', async () => {
  mocks.send.mockResolvedValue({});
  await mount(<ContestSolutionDeleteButton tid="contest" sid="solution" />);

  await userEvent.click(page.getByRole('button', { name: 'Delete solution' }));
  const confirm = page.getByRole('button', { name: 'Confirm' });
  await expect.element(confirm).toBeVisible();
  await userEvent.click(confirm);

  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/contest/contest');
});
