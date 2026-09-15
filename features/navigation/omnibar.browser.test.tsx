import OmnibarProvider, { useOmnibar } from './omnibar-provider';
import en from '@/messages/en.json';
import { STATUS } from '@/shared/configs/status';
import type { ListProjectionProblem } from '@/shared/types/problem';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchOmnibarProblems: vi.fn(),
  searchUsers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: { searchOmnibarProblems: mocks.searchOmnibarProblems },
    User: { searchUsers: mocks.searchUsers },
  },
}));

function methodResult<T>(value: T) {
  return { send: vi.fn().mockResolvedValue(value) };
}

function methodError(error: Error) {
  return { send: vi.fn().mockRejectedValue(error) };
}

function deferredMethod<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { method: { send: vi.fn(() => promise) }, resolve, reject };
}

const problem = {
  _id: 'p1',
  domainId: 'system',
  docType: 10,
  docId: 3,
  pid: 'P3',
  owner: 2,
  title: 'Binary Tree',
  nSubmit: 20,
  nAccept: 8,
  tag: [],
} as ListProjectionProblem;

function Launcher() {
  const { open } = useOmnibar();
  return <button onClick={open}>Open search</button>;
}

function renderOmnibar() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <OmnibarProvider>
        <Launcher />
      </OmnibarProvider>
    </NextIntlClientProvider>
  );
}

function searchInput() {
  return page.getByRole('textbox', { name: 'Search problems and users' });
}

async function openAndSearch(query: string) {
  await userEvent.keyboard('{Control>}k{/Control}');
  const input = searchInput();
  await expect.element(input).toBeVisible();
  await userEvent.fill(input, query);
  await expect
    .poll(
      () =>
        mocks.searchOmnibarProblems.mock.calls.length +
        mocks.searchUsers.mock.calls.length
    )
    .toBeGreaterThanOrEqual(2);
  return input;
}

beforeEach(() => {
  mocks.push.mockReset();
  mocks.searchOmnibarProblems.mockReset();
  mocks.searchUsers.mockReset();
  mocks.searchOmnibarProblems.mockReturnValue(
    methodResult({
      pdocs: [problem],
      psdict: {
        3: {
          _id: 'a'.repeat(24),
          docId: 3,
          docType: 10,
          domainId: 'system',
          rid: 'b'.repeat(24),
          status: STATUS.STATUS_ACCEPTED,
        },
      },
    })
  );
  mocks.searchUsers.mockReturnValue(
    methodResult([
      {
        _id: 7,
        uname: 'alice',
        avatarUrl: '/alice.png',
      },
    ])
  );
});

test('opens with Ctrl-K and Cmd-K, and toggles closed', async () => {
  await renderOmnibar();
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).not.toBeInTheDocument();

  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(dialog).toBeVisible();

  // The omnibar input is an editable context; move focus to the dialog body.
  page.getByRole('dialog').element().focus();
  await userEvent.keyboard('{Meta>}k{/Meta}');
  await expect.element(dialog).not.toBeInTheDocument();
});

test('searches problems and users, then Enter navigates to the highlighted problem', async () => {
  await renderOmnibar();
  const input = await openAndSearch('tree');

  expect(mocks.searchOmnibarProblems).toHaveBeenCalledWith('tree');
  expect(mocks.searchUsers).toHaveBeenCalledWith('system', 'tree');

  const problemOption = page.getByRole('option', { name: /Binary Tree/ });
  await expect.element(problemOption).toBeVisible();
  expect(problemOption.element().getAttribute('href')).toBe('/problem/P3');

  const userOption = page.getByRole('option', { name: /alice/ });
  await expect.element(userOption).toBeVisible();
  expect(userOption.element().getAttribute('href')).toBe('/user/7');

  const statusLink = page.getByRole('link', { name: 'Accepted' });
  await expect.element(statusLink).toBeVisible();
  expect(statusLink.element().getAttribute('href')).toBe(
    `/record/${'b'.repeat(24)}`
  );

  await userEvent.click(input);
  await userEvent.keyboard('{Enter}');
  await expect.poll(() => mocks.push.mock.calls.length).toBe(1);
  expect(mocks.push).toHaveBeenCalledWith('/problem/P3');
});

test('closes when navigating through a problem status', async () => {
  await renderOmnibar();
  await openAndSearch('tree');

  const statusLink = page.getByRole('link', { name: 'Accepted' });
  await expect.element(statusLink).toBeVisible();

  // Keep the test iframe on the harness page while exercising the link.
  const preventNavigation = (event: MouseEvent) => {
    if ((event.target as Element).closest('a')) event.preventDefault();
  };
  document.addEventListener('click', preventNavigation, true);
  try {
    await userEvent.click(statusLink);
  } finally {
    document.removeEventListener('click', preventNavigation, true);
  }

  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('closes on Escape and keeps the last query', async () => {
  await renderOmnibar();
  const input = await openAndSearch('tree');
  await expect.element(input).toHaveValue('tree');

  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(searchInput()).toHaveValue('tree');
  await expect
    .element(page.getByRole('option', { name: /Binary Tree/ }))
    .toBeVisible();
});

test('clears both result lists when the query is emptied', async () => {
  await renderOmnibar();
  const input = await openAndSearch('tree');
  await expect
    .element(page.getByRole('option', { name: /alice/ }))
    .toBeVisible();

  await userEvent.fill(input, '   ');

  await expect.poll(() => page.getByRole('option').elements().length).toBe(0);
  expect(mocks.searchOmnibarProblems).toHaveBeenCalledTimes(1);
});

test('shows a failure message when search requests fail', async () => {
  mocks.searchOmnibarProblems.mockReturnValue(
    methodError(new Error('network'))
  );
  await renderOmnibar();
  await openAndSearch('tree');

  await expect
    .element(
      page.getByText('Could not load results. Try again.', { exact: true })
    )
    .toBeVisible();
});

test('never exposes results from a previous query', async () => {
  await renderOmnibar();
  const input = await openAndSearch('tree');
  await expect
    .element(page.getByRole('option', { name: /Binary Tree/ }))
    .toBeVisible();

  const pendingProblems = deferredMethod<{
    pdocs: ListProjectionProblem[];
    psdict: Record<string, never>;
  }>();
  mocks.searchOmnibarProblems.mockReturnValueOnce(pendingProblems.method);
  mocks.searchUsers.mockReturnValueOnce(methodResult([]));

  await userEvent.fill(input, 'graph');
  await expect.poll(() => page.getByRole('option').elements().length).toBe(0);

  await userEvent.keyboard('{Enter}');
  expect(mocks.push).not.toHaveBeenCalled();

  await expect
    .element(page.getByText('Searching...', { exact: true }))
    .toBeVisible();
  expect(page.getByRole('option').elements()).toHaveLength(0);

  // Mark the deferred rejection as handled before the component callback drains.
  void pendingProblems.method.send().catch(() => {});
  pendingProblems.reject(new Error('network'));
  await expect
    .element(
      page.getByText('Could not load results. Try again.', { exact: true })
    )
    .toBeVisible();
  expect(page.getByRole('option').elements()).toHaveLength(0);
});
