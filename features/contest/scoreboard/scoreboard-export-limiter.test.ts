// @vitest-environment node
import { ScoreboardExportBusyError } from './scoreboard-export-errors';
import {
  MAX_CONCURRENT_EXPORTS,
  renderScoreboardFile,
} from './scoreboard-export-renderer';
import type { ExportLabels } from './scoreboard-export-svg';
import type {
  ScoreboardExportData,
  ScoreboardExportOptions,
} from '@/shared/types/contest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderAsync = vi.hoisted(() => vi.fn());
vi.mock('@resvg/resvg-js', () => ({ renderAsync }));

const data: ScoreboardExportData = {
  tdoc: { title: 'Contest' } as ScoreboardExportData['tdoc'],
  rows: [[{ type: 'user', raw: 1, value: 'alice' }]],
  udict: { 1: { uname: 'alice', avatar: '' } },
  pdict: {},
};
const labels: ExportLabels = {
  details: 'Details',
  noSubmissions: 'No submissions',
  columns: ['#', 'Problem', 'Time', 'Status', 'Score', 'Language'],
  statuses: { accepted: 'Accepted' },
};
const options: ScoreboardExportOptions = {
  avatar: false,
  realName: false,
  details: false,
};

function deferredRender() {
  let resolve!: (image: { asPng: () => Buffer }) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<{ asPng: () => Buffer }>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  renderAsync.mockReset();
});

describe('export concurrency limiter', () => {
  it('rejects a new export at capacity and frees the slot afterwards', async () => {
    const pending: ReturnType<typeof deferredRender>[] = [];
    renderAsync.mockImplementation(() => {
      const render = deferredRender();
      pending.push(render);
      return render.promise;
    });
    const signal = new AbortController().signal;
    const first = renderScoreboardFile(data, options, labels, signal);
    const second = renderScoreboardFile(data, options, labels, signal);
    expect(pending).toHaveLength(MAX_CONCURRENT_EXPORTS);
    await expect(
      renderScoreboardFile(data, options, labels, signal)
    ).rejects.toBeInstanceOf(ScoreboardExportBusyError);

    pending[0].resolve({ asPng: () => Buffer.from('png') });
    pending[1].resolve({ asPng: () => Buffer.from('png') });
    await expect(first).resolves.toMatchObject({ contentType: 'image/png' });
    await expect(second).resolves.toMatchObject({ contentType: 'image/png' });

    const third = renderScoreboardFile(data, options, labels, signal);
    expect(pending).toHaveLength(MAX_CONCURRENT_EXPORTS + 1);
    pending[2].resolve({ asPng: () => Buffer.from('png') });
    await expect(third).resolves.toMatchObject({ contentType: 'image/png' });
  });
  it('releases the slot when rendering fails', async () => {
    renderAsync.mockRejectedValueOnce(new Error('rasterization failed'));
    await expect(
      renderScoreboardFile(data, options, labels, new AbortController().signal)
    ).rejects.toThrow('rasterization failed');

    renderAsync.mockResolvedValueOnce({ asPng: () => Buffer.from('png') });
    await expect(
      renderScoreboardFile(data, options, labels, new AbortController().signal)
    ).resolves.toMatchObject({ contentType: 'image/png' });
  });
  it('releases the slot when the request aborts', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      renderScoreboardFile(data, options, labels, controller.signal)
    ).rejects.toThrow();

    renderAsync.mockResolvedValueOnce({ asPng: () => Buffer.from('png') });
    await expect(
      renderScoreboardFile(data, options, labels, new AbortController().signal)
    ).resolves.toMatchObject({ contentType: 'image/png' });
  });
});
