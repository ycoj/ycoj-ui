import ContestSolutionDeleteButton from './contest-solution-delete-button';
import ContestSolutionForm from './contest-solution-form';
import messages from '@/messages/en.json';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  remove: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      saveContestSolution: mocks.save,
      deleteContestSolution: mocks.remove,
    },
  },
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
beforeEach(() => vi.resetAllMocks());

describe('contest solution form', () => {
  it.each([
    { title: 'a'.repeat(65), content: 'Answer', error: 'titleTooLong' },
    { title: 'Editorial', content: 'a'.repeat(65536), error: 'contentTooLong' },
  ] as const)(
    'rejects $error before saving',
    async ({ title, content, error }) => {
      mount(
        <ContestSolutionForm tid="contest" initialValues={{ title, content }} />
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Create solution' })
      );
      expect(
        await screen.findByText(messages.contestSolution[error])
      ).toBeInTheDocument();
      expect(mocks.save).not.toHaveBeenCalled();
    }
  );
  it('accepts the length limits and ignores surrounding content whitespace', async () => {
    const title = 'a'.repeat(64);
    const content = ` \n${'a'.repeat(65535)}\n `;
    mocks.save.mockResolvedValue({ sid: 'new' });
    mount(
      <ContestSolutionForm tid="contest" initialValues={{ title, content }} />
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/contest/contest/solution/new')
    );
    expect(mocks.save).toHaveBeenCalledWith(
      'contest',
      { title, content },
      undefined
    );
  });
  it('rejects empty title and content', async () => {
    mount(<ContestSolutionForm tid="contest" />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    expect(await screen.findByText('Enter a title.')).toBeInTheDocument();
    expect(screen.getByText('Enter solution content.')).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('creates a solution and navigates to the returned ID', async () => {
    mocks.save.mockResolvedValue({ sid: 'new' });
    mount(<ContestSolutionForm tid="contest" />);
    await userEvent.type(screen.getByLabelText('Title'), 'Editorial');
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: '# Answer\n\n    code' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/contest/contest/solution/new')
    );
    expect(mocks.save).toHaveBeenCalledWith(
      'contest',
      { title: 'Editorial', content: '# Answer\n\n    code' },
      undefined
    );
  });
  it('preserves edit values and shows backend errors without navigating', async () => {
    mocks.save.mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    mount(
      <ContestSolutionForm
        tid="contest"
        sid="solution"
        initialValues={{ title: 'Editorial', content: 'Answer' }}
      />
    );
    expect(screen.getByLabelText('Title')).toHaveValue('Editorial');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.save).toHaveBeenCalledWith(
      'contest',
      { title: 'Editorial', content: 'Answer' },
      'solution'
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('disables submission while saving and handles network failures', async () => {
    let rejectRequest!: (reason: Error) => void;
    mocks.save.mockReturnValue(
      new Promise((_, reject) => {
        rejectRequest = reject;
      })
    );
    mount(
      <ContestSolutionForm
        tid="contest"
        initialValues={{ title: 'Editorial', content: 'Answer' }}
      />
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create solution' })
    );
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    rejectRequest(new Error('Offline'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe('contest solution deletion', () => {
  it('requires confirmation and keeps the page on backend failure', async () => {
    mocks.remove.mockResolvedValue({
      error: { name: 'PermissionError', message: 'Permission denied' },
    });
    mount(<ContestSolutionDeleteButton tid="contest" sid="solution" />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete solution' })
    );
    expect(mocks.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it('returns to the contest after successful deletion', async () => {
    mocks.remove.mockResolvedValue({});
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
