import ContestSolutionForm from './contest-solution-form';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock('@/shared/components/markdown-editor', () => ({
  default: (props: ComponentProps<'textarea'>) => <textarea {...props} />,
}));

function mount(node: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

function renderForm(
  props: Partial<ComponentProps<typeof ContestSolutionForm>> = {}
) {
  const onSubmit = props.onSubmit
    ? vi.fn(props.onSubmit)
    : vi.fn().mockResolvedValue('/contest/contest/solution/new');

  return {
    onSubmit,
    rendered: mount(
      <ContestSolutionForm
        mode="create"
        defaultValues={{ title: '', content: '' }}
        cancelHref="/contest/contest"
        onSubmit={onSubmit}
        {...props}
      />
    ),
  };
}

beforeEach(() => vi.clearAllMocks());

test('rejects empty title and content without submitting', async () => {
  const { onSubmit, rendered } = renderForm();
  await rendered;

  await userEvent.click(page.getByRole('button', { name: 'Create solution' }));

  await expect
    .element(page.getByText('Enter a title.', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText('Enter solution content.', { exact: true }))
    .toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
});

test('submits schema-transformed values and follows the returned path', async () => {
  const { onSubmit, rendered } = renderForm();
  await rendered;

  await userEvent.type(page.getByLabelText('Title'), '  Editorial  ');
  await userEvent.fill(
    page.getByLabelText('Content'),
    ' \n# Answer\n\n    code\n '
  );
  await userEvent.click(page.getByRole('button', { name: 'Create solution' }));

  await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
  expect(onSubmit).toHaveBeenCalledWith({
    title: 'Editorial',
    content: '# Answer\n\n    code',
  });
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/contest/contest/solution/new');
  expect(mocks.refresh).not.toHaveBeenCalled();
});

test('submits with Ctrl+Enter or Cmd+Enter', async () => {
  const { onSubmit, rendered } = renderForm();
  await rendered;

  await userEvent.type(page.getByLabelText('Title'), 'Editorial');
  await userEvent.fill(page.getByLabelText('Content'), 'Answer');
  page.getByLabelText('Title').element().focus();
  await userEvent.keyboard('{Control>}{Enter}{/Control}');

  await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
});

test('preserves edit values and shows submit errors without navigating', async () => {
  const { onSubmit, rendered } = renderForm({
    mode: 'edit',
    defaultValues: {
      title: 'Editorial',
      content: 'Answer',
    },
    cancelHref: '/contest/contest/solution/solution',
    onSubmit: vi.fn().mockRejectedValue(new Error('Permission denied')),
  });
  await rendered;

  await expect.element(page.getByLabelText('Title')).toHaveValue('Editorial');
  await userEvent.click(page.getByRole('button', { name: 'Save' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  expect(onSubmit).toHaveBeenCalledWith({
    title: 'Editorial',
    content: 'Answer',
  });
  expect(mocks.push).not.toHaveBeenCalled();
});

test('disables submission while saving and handles network failures', async () => {
  let rejectRequest!: (reason: Error) => void;
  const onSubmit = vi.fn(
    () =>
      new Promise<string>((_, reject) => {
        rejectRequest = reject;
      })
  );
  const { rendered } = renderForm({ onSubmit });
  await rendered;

  await userEvent.type(page.getByLabelText('Title'), 'Editorial');
  await userEvent.fill(page.getByLabelText('Content'), 'Answer');
  await userEvent.click(page.getByRole('button', { name: 'Create solution' }));

  const saving = page.getByRole('button', { name: 'Saving…' });
  await expect.element(saving).toBeDisabled();
  rejectRequest(new Error('Offline'));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Offline');
  expect(mocks.push).not.toHaveBeenCalled();
});

test('renders extra actions and cancel without tying them to validation', async () => {
  const extra = vi.fn();
  const { rendered } = renderForm({
    mode: 'edit',
    defaultValues: {
      title: 'Editorial',
      content: 'Answer',
    },
    cancelHref: '/contest/contest/solution/solution',
    onSubmit: vi.fn().mockResolvedValue('/contest/contest/solution/solution'),
    extraActions: (
      <button type="button" onClick={extra}>
        Delete
      </button>
    ),
  });
  await rendered;

  await userEvent.fill(page.getByLabelText('Content'), '');
  await userEvent.click(page.getByRole('button', { name: 'Delete' }));

  expect(extra).toHaveBeenCalled();
  const cancel = page.getByRole('link', { name: 'Cancel' });
  await expect.element(cancel).toBeVisible();
  expect(cancel.element().getAttribute('href')).toBe(
    '/contest/contest/solution/solution'
  );
});

test('derives heading and submit copy from mode, not extra actions', async () => {
  const create = renderForm({
    extraActions: <button type="button">Extra</button>,
  });
  const createView = await create.rendered;

  await expect
    .element(page.getByRole('heading', { name: 'Create solution' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Create solution' }))
    .toBeVisible();
  await createView.unmount();

  const edit = renderForm({
    mode: 'edit',
    defaultValues: {
      title: 'Editorial',
      content: 'Answer',
    },
    cancelHref: '/contest/contest/solution/solution',
    onSubmit: vi.fn().mockResolvedValue('/contest/contest/solution/solution'),
  });
  await edit.rendered;

  await expect
    .element(page.getByRole('heading', { name: 'Edit solution' }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: 'Save' }))
    .toBeVisible();
});
