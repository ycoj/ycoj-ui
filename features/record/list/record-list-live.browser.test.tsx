import RecordListLive from './record-list-live';
import type { RecordListResponse } from '@/api/server/method/record/list';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordListItem } from '@/shared/types/record';
import type { BaseUser } from '@/shared/types/user';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const socketMock = vi.hoisted(() => ({
  options: null as null | {
    onOpen?: (send: (data: string) => void) => void;
    onMessage: (message: unknown) => void;
  },
}));

vi.mock('@/shared/hooks/use-record-socket', () => ({
  useRecordSocket: vi.fn(
    (options: {
      onOpen?: (send: (data: string) => void) => void;
      onMessage: (message: unknown) => void;
    }) => {
      socketMock.options = options;
    }
  ),
}));

vi.mock('@/features/record/list/record-list', () => ({
  default: ({ data }: { data: RecordListResponse }) => (
    <div>
      {data.rdocs.map((rdoc) => (
        <div key={rdoc._id} data-testid={`row-${rdoc._id}`}>
          {[
            rdoc.status,
            rdoc.score,
            data.pdict[rdoc.pid]?.title ?? rdoc.pid,
            data.udict[rdoc.uid]?.uname ?? rdoc.uid,
          ].join(':')}
        </div>
      ))}
    </div>
  ),
}));

function makeRecord(
  id: string,
  overrides: Partial<RecordListItem> = {}
): RecordListItem {
  return {
    _id: id,
    domainId: 'system',
    pid: 1000,
    uid: 2,
    lang: 'cc.cc17',
    score: 0,
    memory: 0,
    time: 0,
    rejudged: false,
    judger: 0,
    judgeAt: '',
    status: 0,
    ...overrides,
  };
}

const alice = { _id: 2, uname: 'alice' } as BaseUser;
const problem = { docId: 1000, title: 'Problem A' } as ProblemDoc;

function makeData(overrides: Partial<RecordListResponse> = {}) {
  return {
    page: 1,
    rdocs: [makeRecord('a'.repeat(24)), makeRecord('b'.repeat(24))],
    tdoc: null,
    pdict: { 1000: problem },
    udict: { 2: alice },
    all: false,
    allDomain: false,
    notification: [],
    ...overrides,
  } satisfies RecordListResponse;
}

beforeEach(() => {
  socketMock.options = null;
});

describe('RecordListLive', () => {
  it('updates an existing row in place without reapplying status filters', () => {
    const data = makeData({ filterStatus: 1 });
    render(<RecordListLive data={data} languages={{}} domainId="system" />);

    act(() =>
      socketMock.options!.onMessage({
        rdoc: { _id: data.rdocs[0]._id, status: 2, score: 50 },
        pdoc: problem,
        udoc: alice,
      })
    );

    expect(screen.getByTestId(`row-${data.rdocs[0]._id}`)).toHaveTextContent(
      '2:50:Problem A:alice'
    );
    expect(
      screen.getAllByTestId(/^row-/).map((row) => row.dataset.testid)
    ).toEqual([`row-${data.rdocs[0]._id}`, `row-${data.rdocs[1]._id}`]);
  });

  it('prepends new rows with dictionaries and trims the first page', () => {
    const data = makeData();
    render(<RecordListLive data={data} languages={{}} domainId="system" />);
    const incoming = makeRecord('c'.repeat(24), {
      pid: 1001,
      uid: 3,
      score: 80,
    });
    const pdoc = { docId: 1001, title: 'Problem B' } as ProblemDoc;
    const udoc = { _id: 3, uname: 'bob' } as BaseUser;

    act(() => socketMock.options!.onMessage({ rdoc: incoming, pdoc, udoc }));

    const rows = screen.getAllByTestId(/^row-/);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('data-testid', `row-${incoming._id}`);
    expect(rows[0]).toHaveTextContent('0:80:Problem B:bob');
    expect(screen.queryByTestId(`row-${data.rdocs[1]._id}`)).toBeNull();
  });

  it('falls back to pid and uid when new-row dictionaries are null', () => {
    const data = makeData();
    render(<RecordListLive data={data} languages={{}} domainId="system" />);
    const incoming = makeRecord('c'.repeat(24), { pid: 1001, uid: 3 });

    act(() =>
      socketMock.options!.onMessage({
        rdoc: incoming,
        pdoc: null,
        udoc: null,
      })
    );

    expect(screen.getByTestId(`row-${incoming._id}`)).toHaveTextContent(
      '0:0:1001:3'
    );
  });

  it('ignores unknown records after page one but updates existing rows', () => {
    const data = makeData({ page: 2 });
    render(<RecordListLive data={data} languages={{}} domainId="system" />);

    act(() =>
      socketMock.options!.onMessage({
        rdoc: makeRecord('c'.repeat(24)),
        pdoc: null,
        udoc: null,
      })
    );
    expect(screen.queryByTestId(`row-${'c'.repeat(24)}`)).toBeNull();

    act(() =>
      socketMock.options!.onMessage({
        rdoc: { _id: data.rdocs[1]._id, score: 100 },
        pdoc: problem,
        udoc: alice,
      })
    );
    expect(screen.getByTestId(`row-${data.rdocs[1]._id}`)).toHaveTextContent(
      '0:100:Problem A:alice'
    );
  });

  it('calibrates each open connection with the latest visible rids', () => {
    const data = makeData();
    render(<RecordListLive data={data} languages={{}} domainId="system" />);
    const send = vi.fn();

    act(() => socketMock.options!.onOpen?.(send));
    expect(send).toHaveBeenLastCalledWith(
      JSON.stringify({ rids: data.rdocs.map((rdoc) => rdoc._id) })
    );

    const incoming = makeRecord('c'.repeat(24));
    act(() =>
      socketMock.options!.onMessage({
        rdoc: incoming,
        pdoc: null,
        udoc: null,
      })
    );
    act(() => socketMock.options!.onOpen?.(send));
    expect(send).toHaveBeenLastCalledWith(
      JSON.stringify({ rids: [incoming._id, data.rdocs[0]._id] })
    );
  });

  it('accumulates new rows when the first page starts empty', () => {
    const data = makeData({ rdocs: [] });
    render(<RecordListLive data={data} languages={{}} domainId="system" />);

    for (const id of ['c'.repeat(24), 'd'.repeat(24)]) {
      act(() =>
        socketMock.options!.onMessage({
          rdoc: makeRecord(id),
          pdoc: null,
          udoc: null,
        })
      );
    }

    expect(screen.getAllByTestId(/^row-/)).toHaveLength(2);
  });
});
