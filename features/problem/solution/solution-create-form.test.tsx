import SolutionCreateForm from './solution-create-form';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  edit: vi.fn(),
  send: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Problem: {
      submitProblemSolution: (...args: unknown[]) => {
        mocks.create(...args);
        return { send: mocks.send };
      },
      editProblemSolution: (...args: unknown[]) => {
        mocks.edit(...args);
        return { send: mocks.send };
      },
    },
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/shared/components/markdown-editor', () => ({
  default: (props: ComponentProps<'textarea'>) => (
    <textarea {...props} aria-label="Solution content" />
  ),
}));

beforeEach(() => vi.resetAllMocks());

function mount(edit = false) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {edit ? (
        <SolutionCreateForm
          problemId={1}
          routePid="P1"
          mode="edit"
          psid="solution-id"
          initialContent="Old answer"
        />
      ) : (
        <SolutionCreateForm problemId={1} routePid="P1" />
      )}
    </NextIntlClientProvider>
  );
}

describe('solution submission review behavior', () => {
  it('shows a localized error if the author is blocked after opening the form', async () => {
    mocks.send.mockResolvedValue({
      error: { name: 'SolutionSubmissionBlockedError', message: 'blocked' },
    });
    mount();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Solution content' }),
      'My answer'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(
      await screen.findByText(messages.solution.errors.blocked)
    ).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('My answer');
  });

  it('allows editing and returns to the solution list to show its new review state', async () => {
    mocks.send.mockResolvedValue({
      psdoc: { docId: 'solution-id', reviewStatus: 1 },
    });
    mount(true);
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Updated answer');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mocks.edit).toHaveBeenCalledWith(1, 'solution-id', 'Updated answer');
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/problem/P1/solution')
    );
  });
});
