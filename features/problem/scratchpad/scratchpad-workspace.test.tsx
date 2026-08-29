import { getScratchpadDraft } from './draft-storage';
import ScratchpadWorkspace from './scratchpad-workspace';
import messages from '@/messages/en.json';
import ProblemSample from '@/shared/components/markdown/components/problem-sample';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    ...render(
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

describe('ScratchpadWorkspace', () => {
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

  it('runs a pretest, submits code, and stays in the workspace', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    const editor = screen.getByRole('textbox', { name: 'Editor' });
    await waitFor(() => expect(getScratchpadDraft).toHaveBeenCalled());
    fireEvent.change(editor, { target: { value: 'int main() {}' } });

    await user.click(screen.getByRole('button', { name: /Run/ }));
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

    await waitFor(() => expect(mocks.socketMessage).toBeDefined());
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
    });
    expect(await screen.findByText(/Accepted 5ms 1024KiB/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Submit/ }));
    expect(mocks.submitProblem).toHaveBeenLastCalledWith(
      'P1',
      { lang: 'cc.cc17o2', code: 'int main() {}' },
      'contest-id'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Submitted');
  });

  it('supports F10 submission and restores body scrolling on exit', async () => {
    const onClose = vi.fn();
    const view = renderWorkspace(onClose);
    await waitFor(() => expect(getScratchpadDraft).toHaveBeenCalled());
    fireEvent.change(screen.getByRole('textbox', { name: 'Editor' }), {
      target: { value: 'code' },
    });
    fireEvent.keyDown(document, { key: 'F10' });
    await waitFor(() => expect(mocks.submitProblem).toHaveBeenCalled());

    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'q', altKey: true });
    expect(onClose).toHaveBeenCalled();
    view.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('fills a sample input into the pretest panel', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole('button', { name: 'Fill into pretest' }));

    expect(screen.getByRole('textbox', { name: 'Input' })).toHaveValue('1 2\n');
  });
});
