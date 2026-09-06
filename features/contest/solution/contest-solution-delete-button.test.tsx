import ContestSolutionDeleteButton from './contest-solution-delete-button';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('contest solution deletion', () => {
  it('requires confirmation and keeps the page on backend failure', async () => {
    mocks.send.mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    mount(<ContestSolutionDeleteButton tid="contest" sid="solution" />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    expect(mocks.request).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.request).toHaveBeenCalledWith('contest', 'solution');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('returns to the contest after successful deletion', async () => {
    mocks.send.mockResolvedValue({});
    mount(<ContestSolutionDeleteButton tid="contest" sid="solution" />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/contest/contest')
    );
  });
});
