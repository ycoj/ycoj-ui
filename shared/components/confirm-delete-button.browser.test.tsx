import ConfirmDeleteButton, {
  type ConfirmDeleteButtonProps,
} from './confirm-delete-button';
import ClientApis from '@/api/client/method';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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

test.each(cases)(
  '$name dismisses deletion with cancel without sending a request',
  async ({ delete: mock, props, messages: domainMessages }) => {
    await renderButton(props);
    const trigger = page.getByRole('button', { name: 'Delete', exact: true });
    await userEvent.click(trigger);

    const dialog = page.getByRole('alertdialog', { name: 'Delete' });
    await expect.element(dialog).toBeVisible();
    const describedBy = dialog.element().getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      domainMessages.deleteConfirm
    );
    expect(mock).not.toHaveBeenCalled();

    const cancel = dialog.getByRole('button', { name: 'Cancel' });
    await expect
      .poll(() => document.activeElement === cancel.element())
      .toBe(true);
    await userEvent.click(cancel);

    await expect.element(dialog).not.toBeInTheDocument();
    expect(mock).not.toHaveBeenCalled();
    await expect
      .poll(() => document.activeElement === trigger.element())
      .toBe(true);
  }
);

test.each(cases)(
  '$name dismisses deletion with escape without sending a request',
  async ({ delete: mock, props }) => {
    await renderButton(props);
    const trigger = page.getByRole('button', { name: 'Delete', exact: true });
    await userEvent.click(trigger);

    const dialog = page.getByRole('alertdialog', { name: 'Delete' });
    await expect.element(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await expect.element(dialog).not.toBeInTheDocument();
    expect(mock).not.toHaveBeenCalled();
    await expect
      .poll(() => document.activeElement === trigger.element())
      .toBe(true);
  }
);

test.each(cases)(
  '$name deletes and returns to the target list',
  async ({ delete: mock, props }) => {
    await renderButton(props);
    await userEvent.click(
      page.getByRole('button', { name: 'Delete', exact: true })
    );
    const dialog = page.getByRole('alertdialog', { name: 'Delete' });
    await userEvent.click(
      dialog.getByRole('button', { name: 'Delete', exact: true })
    );

    await expect.poll(() => mock.mock.calls.length).toBe(1);
    expect(mock).toHaveBeenCalledWith('abc123');
    await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
    expect(mocks.push).toHaveBeenCalledWith(props.listRoute);
    expect(mocks.refresh).toHaveBeenCalled();
  }
);

test.each(cases)(
  '$name honors a backend redirect instead of faking a deletion',
  async ({ delete: mock, props }) => {
    mock.mockResolvedValue({ url: '/login?redirect=%2Fhome' });
    await renderButton(props);
    await userEvent.click(
      page.getByRole('button', { name: 'Delete', exact: true })
    );
    const dialog = page.getByRole('alertdialog', { name: 'Delete' });
    await userEvent.click(
      dialog.getByRole('button', { name: 'Delete', exact: true })
    );

    await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
    expect(mocks.push).toHaveBeenCalledWith('/login?redirect=%2Fhome');
    expect(mocks.push).not.toHaveBeenCalledWith(props.listRoute);
  }
);

test.each(cases)(
  '$name shows deletion permission errors without navigating',
  async ({ delete: mock, props }) => {
    mock.mockResolvedValue({
      error: { name: 'ForbiddenError', message: 'Permission denied' },
    });
    await renderButton(props);
    await userEvent.click(
      page.getByRole('button', { name: 'Delete', exact: true })
    );
    const dialog = page.getByRole('alertdialog', { name: 'Delete' });
    await userEvent.click(
      dialog.getByRole('button', { name: 'Delete', exact: true })
    );

    const alert = dialog.getByRole('alert');
    await expect.element(alert).toBeVisible();
    await expect.element(alert).toHaveTextContent('Permission denied');
    expect(mocks.push).not.toHaveBeenCalled();
    await expect
      .element(dialog.getByRole('button', { name: 'Delete', exact: true }))
      .toBeEnabled();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect.element(dialog).not.toBeInTheDocument();
  }
);

test.each(cases)(
  '$name keeps the confirmation open and disables actions while deleting',
  async ({ delete: mock, props, messages: domainMessages }) => {
    let resolve!: (value: object) => void;
    mock.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    await renderButton(props);
    await userEvent.click(
      page.getByRole('button', { name: 'Delete', exact: true })
    );
    const dialog = page.getByRole('alertdialog', { name: 'Delete' });
    await userEvent.click(
      dialog.getByRole('button', { name: 'Delete', exact: true })
    );

    await expect
      .element(dialog.getByRole('button', { name: domainMessages.deleting }))
      .toBeDisabled();
    await expect
      .element(dialog.getByRole('button', { name: 'Cancel' }))
      .toBeDisabled();

    await userEvent.keyboard('{Escape}');
    await expect.element(dialog).toBeVisible();
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();

    resolve({});
    await expect.element(dialog).not.toBeInTheDocument();
    expect(mocks.push).toHaveBeenCalledWith(props.listRoute);
  }
);
