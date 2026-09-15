import { getScratchpadDraft } from './draft-storage';
import ScratchpadWorkspace from './scratchpad-workspace';
import messages from '@/messages/en';
import ProblemSample from '@/shared/components/markdown/components/problem-sample';
import { act } from '@/tests/browser/act';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

const mocks = vi.hoisted(() => ({
  submitProblem: vi.fn(),
  getFullList: vi.fn(),
  socketMessage: undefined as ((message: unknown) => void) | undefined,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: { submitProblem: mocks.submitProblem },
    Record: { getFullList: mocks.getFullList },
  },
}));

vi.mock('./draft-storage', () => ({
  getScratchpadDraft: vi.fn(() => Promise.resolve(null)),
  saveScratchpadDraft: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/shared/components/code/code-editor', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock('@/shared/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/shared/hooks/use-record-socket', () => ({
  useRecordSocket: ({
    onMessage,
  }: {
    onMessage: (message: unknown) => void;
  }) => {
    mocks.socketMessage = onMessage;
    return { reconnect: vi.fn() };
  },
}));
vi.mock('react-resizable-panels', () => ({
  Group: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  Panel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Separator: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

const config = {
  pid: 'P1',
  problemDocId: 1,
  domainId: 'system',
  problemType: 'default',
  title: 'A + B',
  eventKind: 'contest' as const,
  tid: 'contest-id',
  userId: 2,
  preferredLanguage: 'cc.cc17o2',
  languages: {
    cc: {
      display: 'C++',
      versions: [{ name: 'cc.cc17o2', display: 'C++ 17' }],
    },
  },
};

function renderWorkspace(onClose = vi.fn()) {
  return {
    onClose,
    rendered: render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ScratchpadWorkspace
          config={config}
          statement={
            <>
              <p>Read the statement</p>
              <ProblemSample
                data-input={encodeURIComponent('1 2\n')}
                data-output={encodeURIComponent('3\n')}
              />
            </>
          }
          onClose={onClose}
        />
      </NextIntlClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mocks.socketMessage = undefined;
  vi.mocked(getScratchpadDraft).mockResolvedValue(null);
  mocks.getFullList.mockReturnValue({
    send: vi.fn().mockResolvedValue({ rdocs: [] }),
  });
  mocks.submitProblem.mockImplementation(
    (_pid: string, payload: { pretest?: boolean }) => ({
      send: vi
        .fn()
        .mockResolvedValue(
          payload.pretest ? { rid: 'pretest-id' } : { rid: 'record-id' }
        ),
    })
  );
});

test('runs a pretest, submits code, and stays in the workspace', async () => {
  const { rendered } = renderWorkspace();
  const view = await rendered;
  const editor = page.getByRole('textbox', { name: 'Editor' });
  await expect
    .poll(() => vi.mocked(getScratchpadDraft).mock.calls.length)
    .toBeGreaterThan(0);
  await userEvent.fill(editor, 'int main() {}');

  await userEvent.click(page.getByRole('button', { name: /Run/ }));
  expect(mocks.submitProblem).toHaveBeenCalledWith(
    'P1',
    {
      lang: 'cc.cc17o2',
      code: 'int main() {}',
      input: [''],
      pretest: true,
    },
    'contest-id'
  );

  await expect.poll(() => mocks.socketMessage !== undefined).toBe(true);
  await act(async () =>
    mocks.socketMessage?.({
      rdoc: {
        _id: 'pretest-id',
        domainId: 'system',
        pid: 1,
        uid: 2,
        lang: 'cc.cc17o2',
        score: 100,
        contest: '000000000000000000000000',
        status: 1,
        time: 5,
        memory: 1024,
        compilerTexts: [],
        testCases: [],
      },
    })
  );
  await expect.element(page.getByText(/Accepted 5ms 1024KiB/)).toBeVisible();

  await userEvent.click(page.getByRole('button', { name: /Submit/ }));
  expect(mocks.submitProblem).toHaveBeenLastCalledWith(
    'P1',
    { lang: 'cc.cc17o2', code: 'int main() {}' },
    'contest-id'
  );
  await expect.element(page.getByRole('dialog')).toBeVisible();
  expect(mocks.toastSuccess).toHaveBeenCalledWith('Submitted');
  await view.unmount();
});

test('supports F10 submission and restores body scrolling on exit', async () => {
  const { onClose, rendered } = renderWorkspace();
  const view = await rendered;
  await expect
    .poll(() => vi.mocked(getScratchpadDraft).mock.calls.length)
    .toBeGreaterThan(0);
  await userEvent.fill(page.getByRole('textbox', { name: 'Editor' }), 'code');
  await userEvent.keyboard('{F10}');
  await expect
    .poll(() => mocks.submitProblem.mock.calls.length)
    .toBeGreaterThan(0);

  expect(document.body.style.overflow).toBe('hidden');
  await userEvent.keyboard('{Alt>}q{/Alt}');
  await expect.poll(() => onClose.mock.calls.length).toBe(1);
  await view.unmount();
  expect(document.body.style.overflow).toBe('');
});

test('fills a sample input into the pretest panel', async () => {
  const { rendered } = renderWorkspace();
  await rendered;

  await userEvent.click(
    page.getByRole('button', { name: 'Fill into pretest' })
  );

  await expect
    .element(page.getByRole('textbox', { name: 'Input' }))
    .toHaveValue('1 2\n');
});
