import ContestSolutionForm from './contest-solution-form';
import { getContestSolutionDefaults } from './contest-solution-form-utils';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  const onSubmit =
    props.onSubmit ??
    vi.fn().mockResolvedValue('/contest/contest/solution/new');
  return {
    onSubmit,
    ...mount(
      <ContestSolutionForm
        mode="create"
        defaultValues={getContestSolutionDefaults()}
        cancelHref="/contest/contest"
        onSubmit={onSubmit}
        {...props}
      />
    ),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('contest solution form', () => {
  it('rejects empty title and content without submitting', async () => {
    const { onSubmit } = renderForm();
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    expect(await screen.findByText('Enter a title.')).toBeInTheDocument();
    expect(screen.getByText('Enter solution content.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('submits entered values and follows the returned path', async () => {
    const { onSubmit } = renderForm();
    await userEvent.type(screen.getByLabelText('Title'), 'Editorial');
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: '# Answer\n\n    code' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Editorial',
        content: '# Answer\n\n    code',
      })
    );
    expect(mocks.push).toHaveBeenCalledWith('/contest/contest/solution/new');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('submits with Ctrl+Enter or Cmd+Enter', async () => {
    const { onSubmit } = renderForm();
    await userEvent.type(screen.getByLabelText('Title'), 'Editorial');
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'Answer' },
    });
    fireEvent.keyDown(screen.getByLabelText('Title'), {
      key: 'Enter',
      ctrlKey: true,
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('preserves edit values and shows submit errors without navigating', async () => {
    const { onSubmit } = renderForm({
      mode: 'edit',
      defaultValues: {
        title: 'Editorial',
        content: 'Answer',
      },
      cancelHref: '/contest/contest/solution/solution',
      onSubmit: vi.fn().mockRejectedValue(new Error('Permission denied')),
    });
    expect(screen.getByLabelText('Title')).toHaveValue('Editorial');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Editorial',
      content: 'Answer',
    });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('disables submission while saving and handles network failures', async () => {
    let rejectRequest!: (reason: Error) => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<string>((_, reject) => {
          rejectRequest = reject;
        })
    );
    renderForm({ onSubmit });
    await userEvent.type(screen.getByLabelText('Title'), 'Editorial');
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'Answer' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    rejectRequest(new Error('Offline'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('renders extra actions and cancel without tying them to validation', async () => {
    const extra = vi.fn();
    renderForm({
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
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: '' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(extra).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/contest/contest/solution/solution'
    );
  });

  it('derives heading and submit copy from mode, not extra actions', () => {
    const { unmount } = renderForm({
      extraActions: <button type="button">Extra</button>,
    });
    expect(
      screen.getByRole('heading', { name: 'Create solution' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create solution' })
    ).toBeInTheDocument();
    unmount();
    renderForm({
      mode: 'edit',
      defaultValues: {
        title: 'Editorial',
        content: 'Answer',
      },
      cancelHref: '/contest/contest/solution/solution',
      onSubmit: vi.fn().mockResolvedValue('/contest/contest/solution/solution'),
    });
    expect(
      screen.getByRole('heading', { name: 'Edit solution' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
