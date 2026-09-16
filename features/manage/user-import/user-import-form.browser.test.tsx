import UserImportForm from './user-import-form';
import messages from '@/messages/en';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  importUsers: vi.fn(),
  readXlsxTable: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: { User: { importUsers: mocks.importUsers } },
}));
vi.mock('./user-import-xlsx', () => ({
  readXlsxTable: mocks.readXlsxTable,
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Radix checkboxes mount a hidden form input inside the dialog <form>, which
// measures the control with ResizeObserver.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

const response = {
  users: [
    {
      email: 'alice@example.com',
      username: 'alice',
      password: 'Secret123!',
      displayName: 'Alice',
    },
  ],
  messages: ['1 users found.'],
};

function setup() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UserImportForm />
    </NextIntlClientProvider>
  );
  return userEvent.setup();
}

async function addAlice(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add row' }));
  await user.type(screen.getByLabelText('Row 1 Email'), 'alice@example.com');
  await user.type(screen.getByLabelText('Row 1 Username'), 'alice');
  await user.type(screen.getByLabelText('Row 1 Password'), 'Secret123!');
  await user.type(screen.getByLabelText('Row 1 Display name'), 'Alice');
  await user.type(screen.getByLabelText('Row 1 Group'), 'Class A');
}

async function preview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Preview users' }));
  await screen.findByRole('region', { name: 'Import preview' });
}

const aliceSource =
  'alice@example.com\talice\tSecret123!\tAlice\t{"group":"Class A"}';

describe('user import workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.importUsers.mockReturnValue({ send: mocks.send });
    mocks.send.mockResolvedValue(response);
  });

  it('shows an empty state and adds an editable row', async () => {
    const user = setup();
    expect(screen.getByText('No users yet')).toBeInTheDocument();
    await addAlice(user);
    expect(screen.getByText('1 rows')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1 Email')).toHaveValue(
      'alice@example.com'
    );
  });

  it('previews the serialized table, hides passwords, and invalidates on edit', async () => {
    const user = setup();
    await addAlice(user);
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
    await preview(user);
    expect(mocks.importUsers).toHaveBeenCalledWith(aliceSource, true);
    const region = screen.getByRole('region', { name: 'Import preview' });
    expect(within(region).getByText('alice@example.com')).toBeInTheDocument();
    expect(region).not.toHaveTextContent('Secret123!');
    expect(
      screen.getByRole('button', { name: 'Import 1 users' })
    ).toBeEnabled();
    await user.type(screen.getByLabelText('Row 1 School'), 'X');
    expect(
      screen.queryByRole('region', { name: 'Import preview' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
  });

  it('submits the confirmed table and shows creation errors', async () => {
    const user = setup();
    await addAlice(user);
    await preview(user);
    mocks.send.mockResolvedValue({
      ...response,
      messages: ['1 users found.', 'Account creation failed.'],
    });
    await user.click(screen.getByRole('button', { name: 'Import 1 users' }));
    expect(mocks.importUsers).toHaveBeenLastCalledWith(aliceSource, false);
    expect(
      await screen.findByText('Account creation failed.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Import results' })
    ).toBeInTheDocument();
  });

  it('shows backend errors and requires another preview after an uncertain import', async () => {
    const user = setup();
    await addAlice(user);
    await preview(user);
    mocks.send.mockResolvedValue({ error: { message: 'Permission denied' } });
    await user.click(screen.getByRole('button', { name: 'Import 1 users' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied'
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Some accounts may already have been created'
    );
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
  });

  it('warns about missing required fields but still previews', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.type(screen.getByLabelText('Row 1 Username'), 'alice');
    await user.click(screen.getByRole('button', { name: 'Preview users' }));
    expect(
      await screen.findByText(/missing an email, username, or password/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1 Email')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await screen.findByRole('region', { name: 'Import preview' });
  });

  it('requires at least one user before previewing', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Preview users' }));
    expect(
      await screen.findByText('Add at least one user before previewing.')
    ).toBeInTheDocument();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('rejects a payload over the server limit before previewing', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    fireEvent.change(screen.getByLabelText('Row 1 Email'), {
      target: { value: `a${'b'.repeat(70000)}@c.d` },
    });
    await user.click(screen.getByRole('button', { name: 'Preview users' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('too large');
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('downloads the table as a TSV file', async () => {
    const user = setup();
    await addAlice(user);
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:users');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Download TSV' }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe('text/tab-separated-values;charset=utf-8');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes)).toBe(aliceSource);
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('users.tsv');
  });

  it('loads rows from a CSV file', async () => {
    const user = setup();
    const file = new File([''], 'users.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', {
      value: async () => `\uFEFF${aliceSource}\r\n`,
    });
    await user.upload(
      document.querySelector('input[type=file]') as HTMLElement,
      file
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Username')).toHaveValue('alice')
    );
    expect(screen.getByLabelText('Row 1 Group')).toHaveValue('Class A');
    await preview(user);
    expect(mocks.importUsers).toHaveBeenLastCalledWith(aliceSource, true);
  });

  it('drops delimiter-only lines when loading a file', async () => {
    const user = setup();
    const file = new File([''], 'users.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', {
      value: async () => `${aliceSource}\n,,,\n\t\t\n`,
    });
    await user.upload(
      document.querySelector('input[type=file]') as HTMLElement,
      file
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Added 1 rows from the file.')
    );
    expect(screen.getByLabelText('Row 1 Username')).toHaveValue('alice');
    expect(screen.queryByLabelText('Row 2 Email')).not.toBeInTheDocument();
  });

  it('treats a file that parses to only empty rows as empty', async () => {
    const user = setup();
    const file = new File([''], 'users.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', {
      value: async () => ',,,\n\t\t\n',
    });
    await user.upload(
      document.querySelector('input[type=file]') as HTMLElement,
      file
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'The file did not contain any user rows.'
      )
    );
    expect(screen.getByText('No users yet')).toBeInTheDocument();
    expect(screen.queryByLabelText('Row 1 Email')).not.toBeInTheDocument();
  });

  it('loads rows from an XLSX file through the workbook reader', async () => {
    const user = setup();
    mocks.readXlsxTable.mockResolvedValue([
      ['a@b.c', 'alice', 'pw', 'Alice', 'Class A'],
      ['student2'],
    ]);
    await user.upload(
      document.querySelector('input[type=file]') as HTMLElement,
      new File(['x'], 'users.xlsx')
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Username')).toHaveValue('alice')
    );
    expect(screen.getByLabelText('Row 1 Group')).toHaveValue('Class A');
    expect(screen.getByLabelText('Row 2 Username')).toHaveValue('student2');
  });

  it('appends generated usernames as new rows', async () => {
    const user = setup();
    await user.click(
      screen.getByRole('button', { name: 'Generate usernames' })
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Prefix'), 'team');
    fireEvent.change(within(dialog).getByLabelText('How many users'), {
      target: { value: '2' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Username')).toHaveValue('team001')
    );
    expect(screen.getByLabelText('Row 2 Username')).toHaveValue('team002');
    expect(screen.getByLabelText('Row 1 Email')).toHaveValue(
      'team001@ycoj.local'
    );
    expect(screen.getByLabelText('Row 2 Email')).toHaveValue(
      'team002@ycoj.local'
    );
  });

  it('fills empty usernames of existing rows without overwriting a set email', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getAllByRole('button', { name: 'Add row' })[0]);
    await user.type(screen.getByLabelText('Row 1 Email'), 'a@b.c');
    await user.type(screen.getByLabelText('Row 2 Display name'), 'No email');
    await user.click(
      screen.getByRole('button', { name: 'Generate usernames' })
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Prefix'), 's');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Username')).toHaveValue('s001')
    );
    expect(screen.getByLabelText('Row 1 Email')).toHaveValue('a@b.c');
    expect(screen.getByLabelText('Row 2 Username')).toHaveValue('s002');
    expect(screen.getByLabelText('Row 2 Email')).toHaveValue('s002@ycoj.local');
  });

  it('backfills a generated email on rows that already have a username', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getAllByRole('button', { name: 'Add row' })[0]);
    await user.type(screen.getByLabelText('Row 1 Username'), 'alice');
    await user.type(screen.getByLabelText('Row 2 Display name'), 'No name');
    await user.click(
      screen.getByRole('button', { name: 'Generate usernames' })
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Prefix'), 's');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Row 2 Username')).toHaveValue('s001')
    );
    expect(screen.getByLabelText('Row 1 Email')).toHaveValue(
      'alice@ycoj.local'
    );
  });

  it('does not spend generated usernames on completely empty rows', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getAllByRole('button', { name: 'Add row' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Add row' })[0]);
    await user.type(screen.getByLabelText('Row 2 Email'), 'a@b.c');
    await user.type(screen.getByLabelText('Row 3 Display name'), 'No email');
    await user.click(
      screen.getByRole('button', { name: 'Generate usernames' })
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Prefix'), 's');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Row 2 Username')).toHaveValue('s001')
    );
    expect(screen.getByLabelText('Row 3 Username')).toHaveValue('s002');
    expect(screen.getByLabelText('Row 1 Username')).toHaveValue('');
    expect(screen.getByLabelText('Row 1 Email')).toHaveValue('');
  });

  it('applies a dialog when Enter is pressed in a field', async () => {
    const user = setup();
    await user.click(
      screen.getByRole('button', { name: 'Generate usernames' })
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Prefix'), 'team');
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Username')).toHaveValue('team001')
    );
  });

  it('fills passwords with a fixed value or random per-user values', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getAllByRole('button', { name: 'Add row' })[0]);
    await user.type(screen.getByLabelText('Row 1 Email'), 'a@b.c');
    await user.type(screen.getByLabelText('Row 1 Username'), 'alice');
    await user.type(screen.getByLabelText('Row 1 Password'), 'keepme');
    await user.type(screen.getByLabelText('Row 2 Username'), 'bob');

    await user.click(screen.getByRole('button', { name: 'Fill passwords' }));
    let dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Fill passwords' })
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Row 2 Password')).not.toHaveValue('')
    );
    expect(screen.getByLabelText('Row 1 Password')).toHaveValue('keepme');
    const generated = screen.getByLabelText(
      'Row 2 Password'
    ) as HTMLInputElement;
    expect(generated.value).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: 'Fill passwords' }));
    dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText('Same password for all'));
    await user.type(within(dialog).getByLabelText('Password'), 'Same123!');
    await user.click(
      within(dialog).getByRole('button', { name: 'Fill passwords' })
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Password')).toHaveValue('Same123!')
    );
    expect(screen.getByLabelText('Row 2 Password')).toHaveValue('Same123!');
  });

  it('rejects a fixed password outside the 6–255 character range', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.type(screen.getByLabelText('Row 1 Username'), 'alice');
    await user.click(screen.getByRole('button', { name: 'Fill passwords' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText('Same password for all'));
    await user.type(within(dialog).getByLabelText('Password'), 'abc');
    await user.click(
      within(dialog).getByRole('button', { name: 'Fill passwords' })
    );
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Enter a password between 6 and 255 characters.'
    );
    expect(screen.getByLabelText('Row 1 Password')).toHaveValue('');
    expect(dialog).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText('Password'));
    await user.type(within(dialog).getByLabelText('Password'), 'Valid123');
    await user.click(
      within(dialog).getByRole('button', { name: 'Fill passwords' })
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Password')).toHaveValue('Valid123')
    );
  });

  it('appends pasted rows from the paste dialog', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Paste text' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Paste user list'), {
      target: { value: aliceSource },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Add rows' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Row 1 Username')).toHaveValue('alice')
    );
    expect(screen.getByLabelText('Row 1 Group')).toHaveValue('Class A');
  });

  it('keeps the paste dialog open with its text when the apply fails', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Paste text' }));
    const dialog = await screen.findByRole('dialog');
    const textarea = within(dialog).getByLabelText('Paste user list');
    await user.click(within(dialog).getByRole('button', { name: 'Add rows' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Paste at least one row first.'
    );
    fireEvent.change(textarea, { target: { value: ',,,\n,,' } });
    await user.click(within(dialog).getByRole('button', { name: 'Add rows' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'The file did not contain any user rows.'
      )
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(textarea).toHaveValue(',,,\n,,');
    expect(screen.getByText('No users yet')).toBeInTheDocument();
  });

  it('keeps the pasted text when the dialog is closed and reopened', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Paste text' }));
    let dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Paste user list'), 'alice');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: 'Paste text' }));
    dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Paste user list')).toHaveValue(
      'alice'
    );
  });

  it('clears all rows after confirmation', async () => {
    const user = setup();
    await addAlice(user);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Clear all' }));
    await waitFor(() =>
      expect(screen.getByText('No users yet')).toBeInTheDocument()
    );
  });

  it('locks editing and actions while the request is pending', async () => {
    const user = setup();
    await addAlice(user);
    let finish!: (value: typeof response) => void;
    mocks.send.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    await user.click(screen.getByRole('button', { name: 'Preview users' }));
    expect(screen.getByLabelText('Row 1 Email')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    finish(response);
    await screen.findByRole('region', { name: 'Import preview' });
  });
});
