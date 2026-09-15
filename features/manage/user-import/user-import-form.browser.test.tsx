import UserImportForm from './user-import-form';
import messages from '@/messages/en';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

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
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UserImportForm />
    </NextIntlClientProvider>
  );
}

async function addAlice() {
  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.type(page.getByLabelText('Row 1 Email'), 'alice@example.com');
  await userEvent.type(page.getByLabelText('Row 1 Username'), 'alice');
  await userEvent.type(page.getByLabelText('Row 1 Password'), 'Secret123!');
  await userEvent.type(page.getByLabelText('Row 1 Display name'), 'Alice');
  await userEvent.type(page.getByLabelText('Row 1 Group'), 'Class A');
}

async function preview() {
  await userEvent.click(page.getByRole('button', { name: 'Preview users' }));
  await expect
    .element(page.getByRole('region', { name: 'Import preview' }))
    .toBeVisible();
}

async function uploadFile(file: File) {
  const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
  expect(input).not.toBeNull();
  await userEvent.upload(input, file);
}

const aliceSource =
  'alice@example.com\talice\tSecret123!\tAlice\t{"group":"Class A"}';

async function openPasswordsDialog() {
  await userEvent.click(page.getByRole('button', { name: 'Fill passwords' }));
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  // The enter animation fades and zooms the content in; wait until it has
  // finished (or never started) so clicks land on a stable element.
  await expect.poll(() => getComputedStyle(dialog.element()).opacity).toBe('1');
  return dialog;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.importUsers.mockReturnValue({ send: mocks.send });
  mocks.send.mockResolvedValue(response);
});

test('shows an empty state and adds an editable row', async () => {
  await setup();
  await expect
    .element(page.getByText('No users yet', { exact: true }))
    .toBeVisible();

  await addAlice();

  await expect.element(page.getByText('1 rows', { exact: true })).toBeVisible();
  await expect
    .element(page.getByLabelText('Row 1 Email'))
    .toHaveValue('alice@example.com');
});

test('previews the serialized table, hides passwords, and invalidates on edit', async () => {
  await setup();
  await addAlice();

  await expect
    .element(page.getByRole('button', { name: 'Import 0 users' }))
    .toBeDisabled();

  await preview();
  expect(mocks.importUsers).toHaveBeenCalledWith(aliceSource, true);

  const region = page.getByRole('region', { name: 'Import preview' });
  await expect
    .element(region.getByText('alice@example.com', { exact: true }))
    .toBeVisible();
  expect(region.element().textContent).not.toContain('Secret123!');
  await expect
    .element(page.getByRole('button', { name: 'Import 1 users' }))
    .toBeEnabled();

  await userEvent.type(page.getByLabelText('Row 1 School'), 'X');
  await expect
    .element(page.getByRole('region', { name: 'Import preview' }))
    .not.toBeInTheDocument();
  await expect
    .element(page.getByRole('button', { name: 'Import 0 users' }))
    .toBeDisabled();
});

test('submits the confirmed table and shows creation errors', async () => {
  await setup();
  await addAlice();
  await preview();

  mocks.send.mockResolvedValue({
    ...response,
    messages: ['1 users found.', 'Account creation failed.'],
  });
  await userEvent.click(page.getByRole('button', { name: 'Import 1 users' }));

  expect(mocks.importUsers).toHaveBeenLastCalledWith(aliceSource, false);
  await expect
    .element(page.getByText('Account creation failed.', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('heading', { name: 'Import results' }))
    .toBeVisible();
});

test('shows backend errors and requires another preview after an uncertain import', async () => {
  await setup();
  await addAlice();
  await preview();

  mocks.send.mockResolvedValue({ error: { message: 'Permission denied' } });
  await userEvent.click(page.getByRole('button', { name: 'Import 1 users' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('Permission denied');
  await expect
    .element(alert)
    .toHaveTextContent('Some accounts may already have been created');
  await expect
    .element(page.getByRole('button', { name: 'Import 0 users' }))
    .toBeDisabled();
});

test('warns about missing required fields but still previews', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.type(page.getByLabelText('Row 1 Username'), 'alice');
  await userEvent.click(page.getByRole('button', { name: 'Preview users' }));

  await expect
    .element(page.getByText(/missing an email, username, or password/))
    .toBeVisible();
  await expect
    .element(page.getByLabelText('Row 1 Email'))
    .toHaveAttribute('aria-invalid', 'true');
  await expect
    .element(page.getByRole('region', { name: 'Import preview' }))
    .toBeVisible();
});

test('requires at least one user before previewing', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Preview users' }));

  await expect
    .element(
      page.getByText('Add at least one user before previewing.', {
        exact: true,
      })
    )
    .toBeVisible();
  expect(mocks.send).not.toHaveBeenCalled();
});

test('rejects a payload over the server limit before previewing', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.fill(
    page.getByLabelText('Row 1 Email'),
    `a${'b'.repeat(70000)}@c.d`
  );
  await userEvent.click(page.getByRole('button', { name: 'Preview users' }));

  const alert = page.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect.element(alert).toHaveTextContent('too large');
  expect(mocks.send).not.toHaveBeenCalled();
});

test('downloads the table as a TSV file', async () => {
  await setup();
  await addAlice();

  const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:users');
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = vi.fn();
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});

  await userEvent.click(page.getByRole('button', { name: 'Download TSV' }));

  expect(createObjectURL).toHaveBeenCalledOnce();
  const blob = createObjectURL.mock.calls[0][0];
  expect(blob.type).toBe('text/tab-separated-values;charset=utf-8');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
  expect(new TextDecoder().decode(bytes)).toBe(aliceSource);
  const anchor = click.mock.contexts[0] as HTMLAnchorElement;
  expect(anchor.download).toBe('users.tsv');
});

test('loads rows from a CSV file', async () => {
  await setup();

  await uploadFile(
    new File([`\uFEFF${aliceSource}\r\n`], 'users.csv', {
      type: 'text/csv',
    })
  );

  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('alice');
  await expect
    .element(page.getByLabelText('Row 1 Group'))
    .toHaveValue('Class A');
  await preview();
  expect(mocks.importUsers).toHaveBeenLastCalledWith(aliceSource, true);
});

test('drops delimiter-only lines when loading a file', async () => {
  await setup();

  await uploadFile(
    new File([`${aliceSource}\n,,,\n\t\t\n`], 'users.csv', {
      type: 'text/csv',
    })
  );

  await expect
    .poll(() => vi.mocked(toast.success).mock.calls.length)
    .toBeGreaterThan(0);
  expect(toast.success).toHaveBeenCalledWith('Added 1 rows from the file.');
  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('alice');
  await expect
    .element(page.getByLabelText('Row 2 Email'))
    .not.toBeInTheDocument();
});

test('treats a file that parses to only empty rows as empty', async () => {
  await setup();

  await uploadFile(
    new File([',,,\n\t\t\n'], 'users.csv', { type: 'text/csv' })
  );

  await expect
    .poll(() => vi.mocked(toast.error).mock.calls.length)
    .toBeGreaterThan(0);
  expect(toast.error).toHaveBeenCalledWith(
    'The file did not contain any user rows.'
  );
  await expect
    .element(page.getByText('No users yet', { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByLabelText('Row 1 Email'))
    .not.toBeInTheDocument();
});

test('loads rows from an XLSX file through the workbook reader', async () => {
  await setup();

  mocks.readXlsxTable.mockResolvedValue([
    ['a@b.c', 'alice', 'pw', 'Alice', 'Class A'],
    ['student2'],
  ]);
  await uploadFile(new File(['x'], 'users.xlsx'));

  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('alice');
  await expect
    .element(page.getByLabelText('Row 1 Group'))
    .toHaveValue('Class A');
  await expect
    .element(page.getByLabelText('Row 2 Username'))
    .toHaveValue('student2');
});

test('appends generated usernames as new rows', async () => {
  await setup();

  await userEvent.click(
    page.getByRole('button', { name: 'Generate usernames' })
  );
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(dialog.getByLabelText('Prefix'), 'team');
  await userEvent.fill(dialog.getByLabelText('How many users'), '2');
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('team001');
  await expect
    .element(page.getByLabelText('Row 2 Username'))
    .toHaveValue('team002');
  await expect
    .element(page.getByLabelText('Row 1 Email'))
    .toHaveValue('team001@ycoj.local');
  await expect
    .element(page.getByLabelText('Row 2 Email'))
    .toHaveValue('team002@ycoj.local');
});

test('fills empty usernames of existing rows without overwriting a set email', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.click(page.getByRole('button', { name: 'Add row' }).first());
  await userEvent.type(page.getByLabelText('Row 1 Email'), 'a@b.c');
  await userEvent.type(page.getByLabelText('Row 2 Display name'), 'No email');
  await userEvent.click(
    page.getByRole('button', { name: 'Generate usernames' })
  );

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(dialog.getByLabelText('Prefix'), 's');
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('s001');
  await expect.element(page.getByLabelText('Row 1 Email')).toHaveValue('a@b.c');
  await expect
    .element(page.getByLabelText('Row 2 Username'))
    .toHaveValue('s002');
  await expect
    .element(page.getByLabelText('Row 2 Email'))
    .toHaveValue('s002@ycoj.local');
});

test('backfills a generated email on rows that already have a username', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.click(page.getByRole('button', { name: 'Add row' }).first());
  await userEvent.type(page.getByLabelText('Row 1 Username'), 'alice');
  await userEvent.type(page.getByLabelText('Row 2 Display name'), 'No name');
  await userEvent.click(
    page.getByRole('button', { name: 'Generate usernames' })
  );

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(dialog.getByLabelText('Prefix'), 's');
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  await expect
    .element(page.getByLabelText('Row 2 Username'))
    .toHaveValue('s001');
  await expect
    .element(page.getByLabelText('Row 1 Email'))
    .toHaveValue('alice@ycoj.local');
});

test('does not spend generated usernames on completely empty rows', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.click(page.getByRole('button', { name: 'Add row' }).first());
  await userEvent.click(page.getByRole('button', { name: 'Add row' }).first());
  await userEvent.type(page.getByLabelText('Row 2 Email'), 'a@b.c');
  await userEvent.type(page.getByLabelText('Row 3 Display name'), 'No email');
  await userEvent.click(
    page.getByRole('button', { name: 'Generate usernames' })
  );

  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(dialog.getByLabelText('Prefix'), 's');
  await userEvent.click(dialog.getByRole('button', { name: 'Generate' }));

  await expect
    .element(page.getByLabelText('Row 2 Username'))
    .toHaveValue('s001');
  await expect
    .element(page.getByLabelText('Row 3 Username'))
    .toHaveValue('s002');
  await expect.element(page.getByLabelText('Row 1 Username')).toHaveValue('');
  await expect.element(page.getByLabelText('Row 1 Email')).toHaveValue('');
});

test('applies a dialog when Enter is pressed in a field', async () => {
  await setup();

  await userEvent.click(
    page.getByRole('button', { name: 'Generate usernames' })
  );
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(dialog.getByLabelText('Prefix'), 'team');
  await userEvent.keyboard('{Enter}');

  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('team001');
});

test('fills passwords with a fixed value or random per-user values', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.click(page.getByRole('button', { name: 'Add row' }).first());
  await userEvent.type(page.getByLabelText('Row 1 Email'), 'a@b.c');
  await userEvent.type(page.getByLabelText('Row 1 Username'), 'alice');
  await userEvent.type(page.getByLabelText('Row 1 Password'), 'keepme');
  await userEvent.type(page.getByLabelText('Row 2 Username'), 'bob');

  let dialog = await openPasswordsDialog();
  await userEvent.click(
    dialog.getByRole('button', { name: 'Fill passwords', exact: true })
  );

  await expect
    .poll(() =>
      page.getByLabelText('Row 2 Password').element().getAttribute('value')
    )
    .not.toBe('');
  await expect
    .element(page.getByLabelText('Row 1 Password'))
    .toHaveValue('keepme');
  const generated = page
    .getByLabelText('Row 2 Password')
    .element() as HTMLInputElement;
  expect(generated.value).toHaveLength(10);

  dialog = await openPasswordsDialog();
  await userEvent.click(dialog.getByLabelText('Same password for all'));
  await userEvent.type(
    dialog.getByLabelText('Password', { exact: true }),
    'Same123!'
  );
  await userEvent.click(
    dialog.getByRole('button', { name: 'Fill passwords', exact: true })
  );

  await expect
    .element(page.getByLabelText('Row 1 Password'))
    .toHaveValue('Same123!');
  await expect
    .element(page.getByLabelText('Row 2 Password'))
    .toHaveValue('Same123!');
});

test('rejects a fixed password outside the 6-255 character range', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Add row' }));
  await userEvent.type(page.getByLabelText('Row 1 Username'), 'alice');
  const dialog = await openPasswordsDialog();
  await userEvent.click(dialog.getByLabelText('Same password for all'));
  await userEvent.type(
    dialog.getByLabelText('Password', { exact: true }),
    'abc'
  );
  await userEvent.click(
    dialog.getByRole('button', { name: 'Fill passwords', exact: true })
  );

  const alert = dialog.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('Enter a password between 6 and 255 characters.');
  await expect.element(page.getByLabelText('Row 1 Password')).toHaveValue('');
  await expect.element(dialog).toBeVisible();

  await userEvent.fill(
    dialog.getByLabelText('Password', { exact: true }),
    'Valid123'
  );
  await userEvent.click(
    dialog.getByRole('button', { name: 'Fill passwords', exact: true })
  );
  await expect
    .element(page.getByLabelText('Row 1 Password'))
    .toHaveValue('Valid123');
});

test('appends pasted rows from the paste dialog', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Paste text' }));
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.fill(dialog.getByLabelText('Paste user list'), aliceSource);
  await userEvent.click(dialog.getByRole('button', { name: 'Add rows' }));

  await expect
    .element(page.getByLabelText('Row 1 Username'))
    .toHaveValue('alice');
  await expect
    .element(page.getByLabelText('Row 1 Group'))
    .toHaveValue('Class A');
});

test('keeps the paste dialog open with its text when the apply fails', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Paste text' }));
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  const textarea = dialog.getByLabelText('Paste user list');

  await userEvent.click(dialog.getByRole('button', { name: 'Add rows' }));
  const alert = dialog.getByRole('alert');
  await expect.element(alert).toBeVisible();
  await expect
    .element(alert)
    .toHaveTextContent('Paste at least one row first.');

  await userEvent.fill(textarea, ',,,\n,,');
  await userEvent.click(dialog.getByRole('button', { name: 'Add rows' }));
  await expect
    .poll(() => vi.mocked(toast.error).mock.calls.length)
    .toBeGreaterThan(0);
  expect(toast.error).toHaveBeenCalledWith(
    'The file did not contain any user rows.'
  );
  await expect.element(page.getByRole('dialog')).toBeVisible();
  await expect.element(textarea).toHaveValue(',,,\n,,');
  await expect
    .element(page.getByText('No users yet', { exact: true }))
    .toBeVisible();
});

test('keeps the pasted text when the dialog is closed and reopened', async () => {
  await setup();

  await userEvent.click(page.getByRole('button', { name: 'Paste text' }));
  let dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.type(dialog.getByLabelText('Paste user list'), 'alice');
  await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await expect.element(dialog).not.toBeInTheDocument();

  await userEvent.click(page.getByRole('button', { name: 'Paste text' }));
  dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await expect
    .element(dialog.getByLabelText('Paste user list'))
    .toHaveValue('alice');
});

test('clears all rows after confirmation', async () => {
  await setup();
  await addAlice();

  await userEvent.click(page.getByRole('button', { name: 'Clear all' }));
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();
  await userEvent.click(dialog.getByRole('button', { name: 'Clear all' }));

  await expect
    .element(page.getByText('No users yet', { exact: true }))
    .toBeVisible();
});

test('locks editing and actions while the request is pending', async () => {
  await setup();
  await addAlice();

  let finish!: (value: typeof response) => void;
  mocks.send.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  await userEvent.click(page.getByRole('button', { name: 'Preview users' }));

  await expect.element(page.getByLabelText('Row 1 Email')).toBeDisabled();
  await expect
    .element(page.getByRole('button', { name: 'Working…' }))
    .toBeDisabled();

  finish(response);
  await expect
    .element(page.getByRole('region', { name: 'Import preview' }))
    .toBeVisible();
});
