import RecordListLive from './record-list-live';
import type { RecordListResponse } from '@/api/server/method/record/list';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordListItem } from '@/shared/types/record';
import type { BaseUser } from '@/shared/types/user';
import { act } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

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

function rows(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-testid^="row-"]')
  );
}

beforeEach(() => {
  socketMock.options = null;
});

test('updates an existing row in place without reapplying status filters', async () => {
  const data = makeData({ filterStatus: 1 });
  const { container } = await render(
    <RecordListLive data={data} languages={{}} domainId="system" />
  );

  await act(async () =>
    socketMock.options!.onMessage({
      rdoc: { _id: data.rdocs[0]._id, status: 2, score: 50 },
      pdoc: problem,
      udoc: alice,
    })
  );

  expect(
    container.querySelector(`[data-testid="row-${data.rdocs[0]._id}"]`)
  ).toHaveTextContent('2:50:Problem A:alice');
  expect(rows(container).map((row) => row.dataset.testid)).toEqual([
    `row-${data.rdocs[0]._id}`,
    `row-${data.rdocs[1]._id}`,
  ]);
});

test('prepends new rows with dictionaries and trims the first page', async () => {
  const data = makeData();
  const { container } = await render(
    <RecordListLive data={data} languages={{}} domainId="system" />
  );
  const incoming = makeRecord('c'.repeat(24), {
    pid: 1001,
    uid: 3,
    score: 80,
  });
  const pdoc = { docId: 1001, title: 'Problem B' } as ProblemDoc;
  const udoc = { _id: 3, uname: 'bob' } as BaseUser;

  await act(async () =>
    socketMock.options!.onMessage({ rdoc: incoming, pdoc, udoc })
  );

  const rendered = rows(container);
  expect(rendered).toHaveLength(2);
  expect(rendered[0].dataset.testid).toBe(`row-${incoming._id}`);
  expect(rendered[0]).toHaveTextContent('0:80:Problem B:bob');
  expect(
    container.querySelector(`[data-testid="row-${data.rdocs[1]._id}"]`)
  ).toBeNull();
});

test('falls back to pid and uid when new-row dictionaries are null', async () => {
  const data = makeData();
  const { container } = await render(
    <RecordListLive data={data} languages={{}} domainId="system" />
  );
  const incoming = makeRecord('c'.repeat(24), { pid: 1001, uid: 3 });

  await act(async () =>
    socketMock.options!.onMessage({
      rdoc: incoming,
      pdoc: null,
      udoc: null,
    })
  );

  expect(
    container.querySelector(`[data-testid="row-${incoming._id}"]`)
  ).toHaveTextContent('0:0:1001:3');
});

test('ignores unknown records after page one but updates existing rows', async () => {
  const data = makeData({ page: 2 });
  const { container } = await render(
    <RecordListLive data={data} languages={{}} domainId="system" />
  );

  await act(async () =>
    socketMock.options!.onMessage({
      rdoc: makeRecord('c'.repeat(24)),
      pdoc: null,
      udoc: null,
    })
  );
  expect(
    container.querySelector(`[data-testid="row-${'c'.repeat(24)}"]`)
  ).toBeNull();

  await act(async () =>
    socketMock.options!.onMessage({
      rdoc: { _id: data.rdocs[1]._id, score: 100 },
      pdoc: problem,
      udoc: alice,
    })
  );
  expect(
    container.querySelector(`[data-testid="row-${data.rdocs[1]._id}"]`)
  ).toHaveTextContent('0:100:Problem A:alice');
});

test('calibrates each open connection with the latest visible rids', async () => {
  const data = makeData();
  await render(<RecordListLive data={data} languages={{}} domainId="system" />);
  const send = vi.fn();

  await act(async () => socketMock.options?.onOpen?.(send));
  expect(send).toHaveBeenLastCalledWith(
    JSON.stringify({ rids: data.rdocs.map((rdoc) => rdoc._id) })
  );

  const incoming = makeRecord('c'.repeat(24));
  await act(async () =>
    socketMock.options!.onMessage({
      rdoc: incoming,
      pdoc: null,
      udoc: null,
    })
  );
  await act(async () => socketMock.options?.onOpen?.(send));
  expect(send).toHaveBeenLastCalledWith(
    JSON.stringify({ rids: [incoming._id, data.rdocs[0]._id] })
  );
});

test('accumulates new rows when the first page starts empty', async () => {
  const data = makeData({ rdocs: [] });
  const { container } = await render(
    <RecordListLive data={data} languages={{}} domainId="system" />
  );

  for (const id of ['c'.repeat(24), 'd'.repeat(24)]) {
    await act(async () =>
      socketMock.options!.onMessage({
        rdoc: makeRecord(id),
        pdoc: null,
        udoc: null,
      })
    );
  }

  expect(rows(container)).toHaveLength(2);
});
