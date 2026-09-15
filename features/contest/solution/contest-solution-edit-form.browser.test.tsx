import ContestSolutionEditForm from './contest-solution-edit-form';
import type { ContestSolutionFormValues } from './contest-solution-form-utils';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  onSubmit: null as
    null | ((values: ContestSolutionFormValues) => Promise<string>),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      saveContestSolution: (tid: string, payload: unknown, sid: string) => ({
        send: () => mocks.save(tid, payload, sid),
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

test('updates with the validated payload and returns the detail path', async () => {
  await renderEdit();

  await expect
    .element(page.getByRole('heading', { name: 'Edit solution' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Delete contest/solution' }))
    .toBeVisible();
  const cancel = page.getByRole('link', { name: 'Cancel' });
  await expect.element(cancel).toBeVisible();
  expect(cancel.element().getAttribute('href')).toBe(
    '/contest/contest/solution/solution'
  );

  await expect(mocks.onSubmit!(values)).resolves.toBe(
    '/contest/contest/solution/solution'
  );
  expect(mocks.save).toHaveBeenCalledWith('contest', values, 'solution');
});

test('throws a backend error without navigating', async () => {
  mocks.save.mockResolvedValue({
    error: { name: 'PermissionError', message: 'Permission denied' },
  });
  await renderEdit();

  await expect(mocks.onSubmit!(values)).rejects.toThrow('Permission denied');
});
