import ConfirmDeleteButton, {
  type ConfirmDeleteButtonProps,
} from './confirm-delete-button';
import ClientApis from '@/api/client/method';
import messages from '@/messages/en.json';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deleteContest: vi.fn(),
  deleteHomework: vi.fn(),
  deletePaste: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Contest: {
      deleteContest: (id: string) => ({ send: () => mocks.deleteContest(id) }),
    },
    Homework: {
      deleteHomework: (id: string) => ({
        send: () => mocks.deleteHomework(id),
      }),
    },
    Paste: {
      deletePaste: (id: string) => ({ send: () => mocks.deletePaste(id) }),
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const cases: {
  name: string;
  delete: ReturnType<typeof vi.fn>;
  props: ConfirmDeleteButtonProps;
  messages: { deleteConfirm: string; deleting: string };
}[] = [
  {
    name: 'contest',
    delete: mocks.deleteContest,
    props: {
      id: 'abc123',
      namespace: 'contestEdit',
      listRoute: '/contest',
      onDelete: (id) => ClientApis.Contest.deleteContest(id).send(),
    },
    messages: messages.contestEdit,
  },
  {
    name: 'homework',
    delete: mocks.deleteHomework,
    props: {
      id: 'abc123',
      namespace: 'homeworkEdit',
      listRoute: '/homework',
      onDelete: (id) => ClientApis.Homework.deleteHomework(id).send(),
    },
    messages: messages.homeworkEdit,
  },
  {
    name: 'paste',
    delete: mocks.deletePaste,
    props: {
      id: 'abc123',
      namespace: 'paste',
      listRoute: '/paste',
      onDelete: (id) => ClientApis.Paste.deletePaste(id).send(),
    },
    messages: messages.paste,
  },
];

function renderButton(props: ConfirmDeleteButtonProps) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ConfirmDeleteButton {...props} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.deleteContest.mockResolvedValue({});
  mocks.deleteHomework.mockResolvedValue({});
  mocks.deletePaste.mockResolvedValue({});
});

describe.each(cases)(
  '$name confirm delete button',
  ({ delete: mock, props, messages: domainMessages }) => {
    it.each(['cancel', 'escape'] as const)(
      'dismisses deletion with %s without sending a request',
      async (action) => {
        renderButton(props);
        const trigger = screen.getByRole('button', { name: 'Delete' });
        await userEvent.click(trigger);
        const dialog = screen.getByRole('alertdialog', { name: 'Delete' });
        expect(dialog).toHaveAccessibleDescription(
          domainMessages.deleteConfirm
        );
        expect(mock).not.toHaveBeenCalled();
        expect(
          within(dialog).getByRole('button', { name: 'Cancel' })
        ).toHaveFocus();
        if (action === 'cancel') {
          await userEvent.click(
            within(dialog).getByRole('button', { name: 'Cancel' })
          );
        } else {
          await userEvent.keyboard('{Escape}');
        }
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(mock).not.toHaveBeenCalled();
        expect(trigger).toHaveFocus();
      }
    );

    it('deletes and returns to the target list', async () => {
      renderButton(props);
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: 'Delete',
        })
      );
      await waitFor(() => expect(mock).toHaveBeenCalledWith('abc123'));
      expect(mocks.push).toHaveBeenCalledWith(props.listRoute);
      expect(mocks.refresh).toHaveBeenCalled();
    });

    it('shows deletion permission errors without navigating', async () => {
      mock.mockResolvedValue({
        error: { name: 'ForbiddenError', message: 'Permission denied' },
      });
      renderButton(props);
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await userEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: 'Delete',
        })
      );
      const dialog = screen.getByRole('alertdialog');
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Permission denied'
      );
      expect(mocks.push).not.toHaveBeenCalled();
      expect(
        within(dialog).getByRole('button', { name: 'Delete' })
      ).toBeEnabled();
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Cancel' })
      );
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('keeps the confirmation open and disables actions while deleting', async () => {
      let resolve!: (value: object) => void;
      mock.mockReturnValue(
        new Promise((done) => {
          resolve = done;
        })
      );
      renderButton(props);
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      const dialog = screen.getByRole('alertdialog');
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Delete' })
      );
      expect(
        within(dialog).getByRole('button', { name: domainMessages.deleting })
      ).toBeDisabled();
      expect(
        within(dialog).getByRole('button', { name: 'Cancel' })
      ).toBeDisabled();
      await userEvent.keyboard('{Escape}');
      expect(dialog).toBeInTheDocument();
      expect(mock).toHaveBeenCalledTimes(1);
      expect(mocks.push).not.toHaveBeenCalled();
      resolve({});
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      );
      expect(mocks.push).toHaveBeenCalledWith(props.listRoute);
    });
  }
);
