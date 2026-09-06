import ContestSolutionEditForm from './contest-solution-edit-form';
import {
  normalizeContestSolutionPayload,
  type ContestSolutionFormValues,
} from './contest-solution-form-utils';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  onSubmit: null as
    null | ((values: ContestSolutionFormValues) => Promise<string>),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      updateContestSolution: (tid: string, sid: string, payload: unknown) => ({
        send: () => mocks.save(tid, sid, payload),
      }),
    },
  },
}));
vi.mock('@/features/contest/solution/contest-solution-form', () => ({
  default: ({
    onSubmit,
    mode,
    extraActions,
    cancelHref,
  }: {
    onSubmit: (values: ContestSolutionFormValues) => Promise<string>;
    mode: 'create' | 'edit';
    extraActions?: ReactNode;
    cancelHref?: string;
  }) => {
    mocks.onSubmit = onSubmit;
    return (
      <div>
        <h1>
          {mode === 'create'
            ? messages.contestSolution.create
            : messages.contestSolution.edit}
        </h1>
        <button type="button">
          {mode === 'create'
            ? messages.contestSolution.create
            : messages.contestSolution.save}
        </button>
        {extraActions}
        {cancelHref && <a href={cancelHref}>Cancel</a>}
      </div>
    );
  },
}));
vi.mock('@/features/contest/solution/contest-solution-delete-button', () => ({
  default: ({ tid, sid }: { tid: string; sid: string }) => (
    <button type="button">
      Delete {tid}/{sid}
    </button>
  ),
}));

const values: ContestSolutionFormValues = {
  title: 'Editorial',
  content: 'Answer',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onSubmit = null;
  mocks.save.mockResolvedValue({ sid: 'solution' });
});

function renderEdit() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestSolutionEditForm
        tid="contest"
        sid="solution"
        defaultValues={values}
      />
    </NextIntlClientProvider>
  );
}

describe('contest solution edit form', () => {
  it('updates with the trimmed payload and returns the detail path', async () => {
    renderEdit();
    expect(
      screen.getByRole('heading', { name: 'Edit solution' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete contest/solution' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/contest/contest/solution/solution'
    );
    await expect(mocks.onSubmit!(values)).resolves.toBe(
      '/contest/contest/solution/solution'
    );
    expect(mocks.save).toHaveBeenCalledWith(
      'contest',
      'solution',
      normalizeContestSolutionPayload(values)
    );
  });

  it('throws a backend error without navigating', async () => {
    mocks.save.mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    renderEdit();
    await expect(mocks.onSubmit!(values)).rejects.toThrow('Permission denied');
  });
});
