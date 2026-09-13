import UserImportForm from './user-import-form';
import messages from '@/messages/en.json';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ send: vi.fn(), importUsers: vi.fn() }));
vi.mock('@/api/client/method', () => ({
  default: { User: { importUsers: mocks.importUsers } },
}));

const source = 'alice@example.com\talice\tSecret123!\tAlice\t{"group":"A"}';
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
  fireEvent.change(screen.getByLabelText('User list'), {
    target: { value: source },
  });
  return userEvent.setup();
}

async function preview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Preview users' }));
  await screen.findByRole('region', { name: 'Import preview' });
}

describe('user import workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.importUsers.mockReturnValue({ send: mocks.send });
    mocks.send.mockResolvedValue(response);
  });

  it('requires a preview, hides passwords and invalidates the preview when the list changes', async () => {
    const user = setup();
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
    await preview(user);
    expect(mocks.importUsers).toHaveBeenCalledWith(source, true);
    const region = screen.getByRole('region', { name: 'Import preview' });
    expect(within(region).getByText('alice@example.com')).toBeInTheDocument();
    expect(region).not.toHaveTextContent('Secret123!');
    expect(
      screen.getByRole('button', { name: 'Import 1 users' })
    ).toBeEnabled();
    fireEvent.change(screen.getByLabelText('User list'), {
      target: { value: source + '\ninvalid' },
    });
    expect(
      screen.queryByRole('region', { name: 'Import preview' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
  });

  it('submits the original data and shows creation errors without claiming a successful count', async () => {
    const user = setup();
    await preview(user);
    mocks.send.mockResolvedValue({
      ...response,
      messages: ['1 users found.', 'Account creation failed.'],
    });
    await user.click(screen.getByRole('button', { name: 'Import 1 users' }));
    expect(mocks.importUsers).toHaveBeenLastCalledWith(source, false);
    expect(
      await screen.findByText('Account creation failed.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Import results' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('User list')).toHaveValue(source);
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
  });

  it('shows backend errors and requires another preview after an uncertain import', async () => {
    const user = setup();
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

  it('locks editing and actions while the request is pending', async () => {
    const user = setup();
    let finish!: (value: typeof response) => void;
    mocks.send.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    await user.click(screen.getByRole('button', { name: 'Preview users' }));
    expect(screen.getByLabelText('User list')).toBeDisabled();
    expect(screen.getByLabelText('Load a text file (optional)')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    finish(response);
    await screen.findByRole('region', { name: 'Import preview' });
  });

  it('does not allow empty or entirely invalid batches to be imported', async () => {
    const user = setup();
    fireEvent.change(screen.getByLabelText('User list'), {
      target: { value: '   ' },
    });
    await user.click(screen.getByRole('button', { name: 'Preview users' }));
    expect(
      await screen.findByText('Add at least one user before previewing.')
    ).toBeInTheDocument();
    expect(mocks.send).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('User list'), {
      target: { value: 'invalid' },
    });
    mocks.send.mockResolvedValue({
      users: [],
      messages: ['Line 1: Input invalid.', '0 users found.'],
    });
    await preview(user);
    expect(screen.getByText('Line 1: Input invalid.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
  });

  it('loads a file and normalizes BOM and line endings without altering extra details', async () => {
    const user = setup();
    await preview(user);
    const file = new File([''], 'users.tsv', {
      type: 'text/tab-separated-values',
    });
    Object.defineProperty(file, 'text', {
      value: async () => `\uFEFF${source}\r\n`,
    });
    await user.upload(
      screen.getByLabelText('Load a text file (optional)'),
      file
    );
    await waitFor(() =>
      expect(screen.getByLabelText('User list')).toHaveValue(
        `\uFEFF${source}\n`
      )
    );
    expect(
      screen.getByRole('button', { name: 'Import 0 users' })
    ).toBeDisabled();
    await preview(user);
    expect(mocks.importUsers).toHaveBeenLastCalledWith(`${source}\n`, true);
  });
});
