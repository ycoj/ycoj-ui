import ContestSolutionCreateForm from './contest-solution-create-form';
import type { ContestSolutionFormValues } from './contest-solution-form-utils';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  onSubmit: null as
    null | ((values: ContestSolutionFormValues) => Promise<string>),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      saveContestSolution: (tid: string, payload: unknown) => ({
        send: () => mocks.save(tid, payload),
      }),
    },
  },
}));
vi.mock('@/features/contest/solution/contest-solution-form', () => ({
  default: ({
    onSubmit,
    mode,
  }: {
    onSubmit: (values: ContestSolutionFormValues) => Promise<string>;
    mode: 'create' | 'edit';
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
      </div>
    );
  },
}));

const values: ContestSolutionFormValues = {
  title: 'Editorial',
  content: 'Answer',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onSubmit = null;
  mocks.save.mockResolvedValue({ sid: 'new' });
});

function renderCreate() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContestSolutionCreateForm tid="contest" />
    </NextIntlClientProvider>
  );
}

describe('contest solution create form', () => {
  it('creates with the validated payload and returns the detail path', async () => {
    renderCreate();
    expect(
      screen.getByRole('heading', { name: 'Create solution' })
    ).toBeInTheDocument();
    await expect(mocks.onSubmit!(values)).resolves.toBe(
      '/contest/contest/solution/new'
    );
    expect(mocks.save).toHaveBeenCalledWith('contest', values);
  });

  it('throws a backend error without navigating', async () => {
    mocks.save.mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    renderCreate();
    await expect(mocks.onSubmit!(values)).rejects.toThrow('Permission denied');
  });

  it('throws when the backend omits the new solution id', async () => {
    mocks.save.mockResolvedValue({});
    renderCreate();
    await expect(mocks.onSubmit!(values)).rejects.toThrow(
      messages.contestSolution.saveFailed
    );
  });
});
