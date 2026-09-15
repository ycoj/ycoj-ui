import SolutionCreateForm from './solution-create-form';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

test('shows a localized error if the author is blocked after opening the form', async () => {
  mocks.send.mockResolvedValue({
    error: { name: 'SolutionSubmissionBlockedError', message: 'blocked' },
  });
  await mount();

  const editor = page.getByRole('textbox', { name: 'Solution content' });
  await userEvent.type(editor, 'My answer');
  await userEvent.click(page.getByRole('button', { name: 'Publish' }));

  await expect
    .element(page.getByText(messages.solution.errors.blocked, { exact: true }))
    .toBeVisible();
  expect(mocks.push).not.toHaveBeenCalled();
  await expect.element(editor).toHaveValue('My answer');
});

test('allows editing and returns to the solution list to show its new review state', async () => {
  mocks.send.mockResolvedValue({
    psdoc: { docId: 'solution-id', reviewStatus: 1 },
  });
  await mount(true);

  const editor = page.getByRole('textbox');
  await editor.fill('Updated answer');
  await userEvent.click(page.getByRole('button', { name: 'Save' }));

  expect(mocks.edit).toHaveBeenCalledWith(1, 'solution-id', 'Updated answer');
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/problem/P1/solution');
});
