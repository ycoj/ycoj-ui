import ProblemAutoComplete from './problem-auto-complete';
import messages from '@/messages/en.json';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchProblems: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { searchProblems: mocks.searchProblems } },
}));

describe('ProblemAutoComplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    mocks.searchProblems.mockReset();
  });

  it('resolves an existing numeric ID to the problem label', async () => {
    const send = vi.fn().mockResolvedValue({
      pdocs: [{ docId: 1000, pid: 'P1000', title: 'Binary Tree' }],
    });
    mocks.searchProblems.mockReturnValue({ send });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProblemAutoComplete
          domainId="system"
          value="1000"
          onValueChange={vi.fn()}
          ariaLabel="Problem ID"
        />
      </NextIntlClientProvider>
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.searchProblems).toHaveBeenCalledWith('system', '1000');
    expect(screen.getByRole('combobox', { name: 'Problem ID' })).toHaveValue(
      'P1000 Binary Tree'
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Problem ID' }));

    expect(screen.getByRole('combobox', { name: 'Problem ID' })).toHaveValue(
      'Binary Tree'
    );
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.searchProblems).toHaveBeenLastCalledWith(
      'system',
      'Binary Tree'
    );
  });
});
