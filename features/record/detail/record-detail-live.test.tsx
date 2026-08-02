import RecordDetailLive from './record-detail-live';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const socketMock = vi.hoisted(() => ({
  options: null as null | { onMessage: (message: unknown) => void },
  reconnect: vi.fn(),
}));

const clientMock = vi.hoisted(() => ({
  rejudge: vi.fn(),
}));

vi.mock('@/shared/hooks/use-record-socket', () => ({
  useRecordSocket: vi.fn(
    (options: { onMessage: (message: unknown) => void }) => {
      socketMock.options = options;
      return { reconnect: socketMock.reconnect };
    }
  ),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Record: {
      rejudge: clientMock.rejudge,
    },
  },
}));

vi.mock('@/features/record/detail/record-detail', () => ({
  default: ({
    rdoc,
    onRejudge,
  }: {
    rdoc: RecordDoc;
    onRejudge?: () => Promise<void>;
  }) => (
    <div>
      <div data-testid="detail">{`${rdoc.status}:${rdoc.score}:${rdoc.time}`}</div>
      <button
        type="button"
        onClick={() => {
          void onRejudge?.().catch(() => {});
        }}
      >
        rejudge
      </button>
    </div>
  ),
}));

vi.mock('@/features/record/detail/record-code', () => ({
  default: ({ rdoc }: { rdoc: RecordDoc }) => (
    <div data-testid="code">{rdoc.code}</div>
  ),
}));

vi.mock('@/features/record/detail/record-compiler-message', () => ({
  RecordCompilerMessage: ({ rdoc }: { rdoc: RecordDoc }) => (
    <div data-testid="compiler">{rdoc.compilerTexts.join(',')}</div>
  ),
}));

vi.mock('@/features/record/detail/record-testcases', () => ({
  RecordTestcases: ({ rdoc }: { rdoc: RecordDoc }) => (
    <div data-testid="testcases">
      {rdoc.testCases.map((testCase) => testCase.status).join(',')}
    </div>
  ),
}));

vi.mock('@/shared/layout/two-column', () => ({
  default: ({ left }: { left: React.ReactNode }) => <div>{left}</div>,
}));

const rdoc: RecordDoc = {
  _id: '66ab1234567890abcdef1234',
  domainId: 'system',
  pid: 1000,
  uid: 2,
  lang: 'cc.cc17',
  code: 'original code',
  score: 0,
  memory: 0,
  time: 0,
  judgeTexts: [],
  compilerTexts: [],
  testCases: [],
  rejudged: false,
  judger: 0,
  judgeAt: '',
  status: 0,
};

const props = {
  rdoc,
  pdoc: { docId: 1000, title: 'Problem' } as ProblemDoc,
  udoc: { _id: 2, uname: 'alice' } as User,
  languages: {},
  allowRejudge: false,
};

beforeEach(() => {
  socketMock.options = null;
  socketMock.reconnect.mockClear();
  clientMock.rejudge.mockReset();
});

describe('RecordDetailLive', () => {
  it('updates every record section from the matching websocket frame', () => {
    render(<RecordDetailLive {...props} />);

    act(() =>
      socketMock.options!.onMessage({
        rdoc: {
          _id: rdoc._id,
          status: 1,
          score: 100,
          time: 25,
          compilerTexts: ['compiled'],
          testCases: [
            {
              id: 1,
              subtaskId: 0,
              score: 100,
              time: 25,
              memory: 1024,
              status: 1,
              message: '',
            },
          ],
        },
      })
    );

    expect(screen.getByTestId('detail')).toHaveTextContent('1:100:25');
    expect(screen.getByTestId('compiler')).toHaveTextContent('compiled');
    expect(screen.getByTestId('testcases')).toHaveTextContent('1');
  });

  it('ignores other records and preserves fields missing from updates', () => {
    render(<RecordDetailLive {...props} />);

    act(() =>
      socketMock.options!.onMessage({
        rdoc: { _id: 'ffffffffffffffffffffffff', status: 2, code: 'other' },
      })
    );
    expect(screen.getByTestId('detail')).toHaveTextContent('0:0:0');
    expect(screen.getByTestId('code')).toHaveTextContent('original code');

    act(() =>
      socketMock.options!.onMessage({
        rdoc: { _id: rdoc._id, score: 50, code: 'socket code' },
      })
    );
    expect(screen.getByTestId('detail')).toHaveTextContent('0:50:0');
    expect(screen.getByTestId('code')).toHaveTextContent('original code');
  });

  it('reopens the websocket connection after a successful rejudge', async () => {
    const user = userEvent.setup();
    clientMock.rejudge.mockResolvedValue({});
    render(<RecordDetailLive {...props} allowRejudge />);

    await user.click(screen.getByRole('button', { name: 'rejudge' }));

    expect(clientMock.rejudge).toHaveBeenCalledWith(rdoc._id);
    expect(socketMock.reconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps the websocket closed when the rejudge request fails', async () => {
    const user = userEvent.setup();
    clientMock.rejudge.mockResolvedValue({
      error: { name: 'PermissionError', message: 'denied' },
    });
    render(<RecordDetailLive {...props} allowRejudge />);

    await user.click(screen.getByRole('button', { name: 'rejudge' }));

    expect(clientMock.rejudge).toHaveBeenCalledWith(rdoc._id);
    expect(socketMock.reconnect).not.toHaveBeenCalled();
  });
});
