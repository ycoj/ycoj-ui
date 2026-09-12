// @vitest-environment node
import { renderScoreboardFile } from './scoreboard-export-renderer';
import type { ExportLabels } from './scoreboard-export-svg';
import type { ScoreboardImageData } from './scoreboard-export-utils';
import JSZip from 'jszip';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@resvg/resvg-js', () => ({
  renderAsync: async () => ({ asPng: () => Buffer.from('rendered-png') }),
}));

const data: ScoreboardImageData = {
  tdoc: { title: 'Contest' } as ScoreboardImageData['tdoc'],
  rows: [[{ type: 'user', raw: 2, value: 'alice' }]],
  udict: { 2: { uname: 'alice', avatar: '', realName: 'Alice' } },
  pdict: {},
};
const labels: ExportLabels = {
  details: 'Details',
  noSubmissions: 'No submissions',
  columns: ['#', 'Problem', 'Time', 'Status', 'Score', 'Language'],
  statuses: { accepted: 'Accepted', wrongAnswer: 'Wrong answer' },
};
const options = { avatar: false, realName: true, details: true };

afterEach(() => vi.restoreAllMocks());

describe('scoreboard archive finalization', () => {
  it('stops generating the ZIP when the request aborts during finalization', async () => {
    const source = new PassThrough();
    const spy = vi
      .spyOn(JSZip.prototype, 'generateNodeStream')
      .mockReturnValue(source);
    const controller = new AbortController();
    const file = renderScoreboardFile(data, options, labels, controller.signal);
    await vi.waitFor(() => expect(spy).toHaveBeenCalled());
    source.write(Buffer.alloc(1024));
    controller.abort(new Error('client disconnected'));
    await expect(file).rejects.toMatchObject({
      name: 'AbortError',
      cause: expect.objectContaining({ message: 'client disconnected' }),
    });
    expect(source.destroyed).toBe(true);
  });
});
