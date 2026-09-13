// @vitest-environment node
import {
  MAX_AVATAR_DATA_URI_PREFIX,
  MAX_EXPORT_AVATAR_BYTES,
  MAX_EXPORT_AVATAR_PIXELS,
  MAX_EXPORT_AVATAR_TOTAL_BYTES,
  MAX_EXPORT_AVATAR_TOTAL_PIXELS,
} from './scoreboard-export-avatar';
import { ScoreboardExportLimitError } from './scoreboard-export-errors';
import {
  MAX_EXPORT_DETAIL_PARTICIPANTS,
  MAX_EXPORT_PARTICIPANTS,
  loadExportAvatars,
  renderScoreboardFile,
} from './scoreboard-export-renderer';
import { buildScoreboardSvg, type ExportLabels } from './scoreboard-export-svg';
import type { ScoreboardExportData } from '@/shared/types/contest';
import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';

const loadExportAvatar = vi.hoisted(() => vi.fn());
vi.mock('./scoreboard-export-avatar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./scoreboard-export-avatar')>()),
  loadExportAvatar,
}));

afterEach(() => loadExportAvatar.mockReset());

const data: ScoreboardExportData = {
  tdoc: { title: '测试 <script> & contest' } as ScoreboardExportData['tdoc'],
  rows: [
    [{ type: 'string', value: 'User' }],
    [{ type: 'user', raw: 2, value: 'alice' }],
    [{ type: 'user', raw: 3, value: 'bob' }],
  ],
  udict: {
    2: { uname: 'alice', avatar: '', realName: '张三' },
    3: { uname: 'bob', avatar: '', realName: '张三' },
  },
  pdict: {},
  submissions: {
    2: [
      {
        rid: 'record-one',
        pid: 1000,
        status: 1,
        score: 100,
        submittedAt: '2026-09-01T00:00:00Z',
      },
      {
        rid: 'record-two',
        pid: 1000,
        status: 2,
        score: 0,
        submittedAt: '2026-09-01T00:01:00Z',
      },
    ],
    3: [],
  },
};
const labels: ExportLabels = {
  details: '提交详情',
  noSubmissions: '暂无提交记录',
  columns: ['编号', '题目', '时间', '状态', '分数', '语言'],
  statuses: { accepted: 'Accepted', wrongAnswer: 'Wrong answer' },
};
const options = { avatar: false, realName: true, details: true };

describe('server image renderer', () => {
  it('escapes content, replaces usernames, and renders only the selected participant’s attempts', () => {
    const svg = buildScoreboardSvg(data, options, labels, {}, 2);
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('张三');
    expect(svg).not.toContain('alice');
    expect(svg).toContain('record-one');
    expect(svg).toContain('record-two');
    const empty = buildScoreboardSvg(data, options, labels, {}, 3);
    expect(empty).not.toContain('record-one');
    expect(empty).toContain('暂无提交记录');
  });
  it.each([false, true])(
    'preserves problem titles, score colors and first solves with realName=%s',
    (realName) => {
      const fixture: ScoreboardExportData = {
        ...data,
        rows: [
          [
            { type: 'user', value: 'User' },
            { type: 'problem', raw: 1000, value: 'A' },
            { type: 'problem', raw: 1001, value: 'B' },
          ],
          [
            { type: 'user', raw: 2, value: 'alice' },
            { type: 'record', value: '100', score: 100, first: true },
            { type: 'records', value: '', raw: [{ value: 60 }, { value: 0 }] },
          ],
        ],
        pdict: {
          1000: { title: '题目标题' },
          1001: { title: 'Second problem' },
        } as unknown as ScoreboardExportData['pdict'],
      };
      const svg = buildScoreboardSvg(
        fixture,
        { ...options, realName },
        labels,
        {}
      );
      expect(svg).toContain('题目标题');
      expect(svg).toContain('Second problem');
      expect(svg).toContain(realName ? '张三' : 'alice');
      expect(svg).toContain('<tspan fill="#16a34a">100</tspan>');
      expect(svg).toContain('<tspan fill="#f97316">60</tspan>');
      expect(svg).toContain('<tspan fill="#ef4444">0</tspan>');
      expect(svg.match(/<ellipse /g)).toHaveLength(2);
      expect(svg).not.toContain('record-one');
    }
  );
  it('resolves problem titles for numeric string ids', () => {
    const svg = buildScoreboardSvg(
      {
        ...data,
        rows: [[{ type: 'problem', raw: '1000', value: 'A' }]],
        pdict: {
          1000: { title: '题目标题' },
        } as unknown as ScoreboardExportData['pdict'],
      },
      options,
      labels,
      {}
    );
    expect(svg).toContain('题目标题');
  });
  it('renders accepted and pending ICPC marks without literal backend HTML', () => {
    const svg = buildScoreboardSvg(
      {
        ...data,
        rows: [
          data.rows[0],
          [
            {
              type: 'record',
              score: 100,
              value: '<span class="icon icon-check"></span>\n00:12',
            },
          ],
          [
            {
              type: 'record',
              score: 0,
              value: '-1 <span style="color:orange">+2</span>',
            },
          ],
        ],
      },
      options,
      labels,
      {}
    );
    expect(svg).toContain('✓');
    expect(svg).toContain('<tspan fill="#f97316">+2</tspan>');
    expect(svg).not.toContain('&lt;span');
  });
  it('uses usernames when real names are missing', () => {
    const svg = buildScoreboardSvg(
      { ...data, udict: { 2: { ...data.udict[2], realName: '' } } },
      options,
      labels,
      {},
      2
    );
    expect(svg).toContain('alice');
  });
  it('renders a real PNG on Node without a browser or remote fonts', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Unexpected network request'));
    try {
      const file = await renderScoreboardFile(
        data,
        { ...options, details: false },
        labels,
        new AbortController().signal
      );
      expect(file.contentType).toBe('image/png');
      expect(file.body.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );
      expect(file.body.readUInt32BE(16)).toBeGreaterThanOrEqual(800);
      expect(file.body.length).toBeGreaterThan(1000);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      fetch.mockRestore();
    }
  });
  it('packages one actual PNG per participant and preserves duplicate names', async () => {
    const file = await renderScoreboardFile(
      data,
      options,
      labels,
      new AbortController().signal
    );
    const zip = await JSZip.loadAsync(file.body);
    expect(Object.keys(zip.files)).toEqual([
      'scoreboard.png',
      '2-张三.png',
      '3-张三.png',
    ]);
    for (const entry of Object.values(zip.files)) {
      const png = await entry.async('nodebuffer');
      expect(png.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );
    }
  });
  it('stops rendering when the client disconnects', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      renderScoreboardFile(data, options, labels, controller.signal)
    ).rejects.toThrow();
  });
  it('rejects exports above the participant limit before rasterizing', async () => {
    const oversizedData = {
      ...data,
      udict: Object.fromEntries(
        Array.from({ length: MAX_EXPORT_PARTICIPANTS + 1 }, (_, index) => [
          index,
          { uname: `user-${index}`, avatar: '', realName: '' },
        ])
      ),
    } as ScoreboardExportData;
    const result = renderScoreboardFile(
      oversizedData,
      { ...options, details: false },
      labels,
      new AbortController().signal
    );
    await expect(result).rejects.toBeInstanceOf(ScoreboardExportLimitError);
    await expect(result).rejects.toThrow('participant limit');
  });
  it('rejects detail exports above the detail participant limit before rasterizing', async () => {
    const oversizedData = {
      ...data,
      udict: Object.fromEntries(
        Array.from(
          { length: MAX_EXPORT_DETAIL_PARTICIPANTS + 1 },
          (_, index) => [
            index,
            { uname: `user-${index}`, avatar: '', realName: '' },
          ]
        )
      ),
    } as ScoreboardExportData;
    const result = renderScoreboardFile(
      oversizedData,
      options,
      labels,
      new AbortController().signal
    );
    await expect(result).rejects.toBeInstanceOf(ScoreboardExportLimitError);
    await expect(result).rejects.toThrow('participant limit');
  });
});

describe('avatar preloading budget', () => {
  const DATA_URI_PREFIX = 'data:image/png;base64,';
  const DATA_URI_CHUNK = 1.5 * 1024 * 1024;

  function makeUdict(uids: number[]) {
    return Object.fromEntries(
      uids.map((uid) => [uid, { uname: `user-${uid}`, avatar: '' }])
    );
  }

  it('clamps the raw allowance to the embedded budget that remains', async () => {
    loadExportAvatar.mockImplementation(
      async (_avatar, _signal, maxBytes, maxPixels) => {
        const embedded = Math.min(
          DATA_URI_CHUNK,
          DATA_URI_PREFIX.length + Math.ceil((maxBytes * 4) / 3)
        );
        return {
          dataUri:
            DATA_URI_PREFIX + 'x'.repeat(embedded - DATA_URI_PREFIX.length),
          pixels: Math.min(64 * 64, maxPixels),
        };
      }
    );
    const uids = Array.from({ length: 30 }, (_, index) => index);

    const avatars = await loadExportAvatars(
      uids,
      makeUdict(uids),
      new AbortController().signal
    );

    const calls = loadExportAvatar.mock.calls;
    const totalEmbedded = Object.values(avatars).reduce(
      (total, dataUri) => total + dataUri.length,
      0
    );
    const remaining =
      MAX_EXPORT_AVATAR_TOTAL_BYTES - (calls.length - 1) * DATA_URI_CHUNK;
    const lastAllowance = calls.at(-1)?.[2];
    expect(calls[0][2]).toBe(MAX_EXPORT_AVATAR_BYTES);
    expect(calls[0][3]).toBe(MAX_EXPORT_AVATAR_PIXELS);
    expect(lastAllowance).toBe(
      Math.floor((remaining - MAX_AVATAR_DATA_URI_PREFIX) / 4) * 3
    );
    expect(lastAllowance).toBeLessThan(MAX_EXPORT_AVATAR_BYTES);
    expect(totalEmbedded).toBeLessThanOrEqual(MAX_EXPORT_AVATAR_TOTAL_BYTES);
    expect(Object.keys(avatars)).toHaveLength(calls.length);
  });

  it('stops preloading once the aggregate pixel budget is spent', async () => {
    loadExportAvatar.mockImplementation(
      async (_avatar, _signal, _maxBytes, maxPixels) => ({
        dataUri: 'data:image/png;base64,AAAA',
        pixels: maxPixels,
      })
    );
    const uids = Array.from({ length: 30 }, (_, index) => index);

    const avatars = await loadExportAvatars(
      uids,
      makeUdict(uids),
      new AbortController().signal
    );

    const calls = loadExportAvatar.mock.calls;
    expect(calls).toHaveLength(
      MAX_EXPORT_AVATAR_TOTAL_PIXELS / MAX_EXPORT_AVATAR_PIXELS
    );
    expect(calls[0][3]).toBe(MAX_EXPORT_AVATAR_PIXELS);
    expect(calls.at(-1)?.[3]).toBe(MAX_EXPORT_AVATAR_PIXELS);
    expect(Object.keys(avatars)).toHaveLength(calls.length);
  });

  it('clamps the pixel allowance to the aggregate budget that remains', async () => {
    const returnedPixels: number[] = [];
    loadExportAvatar.mockImplementation(
      async (_avatar, _signal, _maxBytes, maxPixels) => {
        const pixels = Math.min(600_000, maxPixels);
        returnedPixels.push(pixels);
        return { dataUri: 'data:image/png;base64,AAAA', pixels };
      }
    );
    const uids = Array.from({ length: 30 }, (_, index) => index);

    const avatars = await loadExportAvatars(
      uids,
      makeUdict(uids),
      new AbortController().signal
    );

    const calls = loadExportAvatar.mock.calls;
    const retainedBeforeLast = returnedPixels
      .slice(0, -1)
      .reduce((total, pixels) => total + pixels, 0);
    const totalPixels = returnedPixels.reduce(
      (total, pixels) => total + pixels,
      0
    );
    const lastAllowance = calls.at(-1)?.[3];
    expect(lastAllowance).toBe(
      MAX_EXPORT_AVATAR_TOTAL_PIXELS - retainedBeforeLast
    );
    expect(lastAllowance).toBeLessThan(MAX_EXPORT_AVATAR_PIXELS);
    expect(totalPixels).toBeLessThanOrEqual(MAX_EXPORT_AVATAR_TOTAL_PIXELS);
    expect(Object.keys(avatars)).toHaveLength(calls.length);
  });

  it('omits oversized avatars and keeps the ones within the budget', async () => {
    loadExportAvatar.mockResolvedValueOnce('').mockResolvedValueOnce({
      dataUri: 'data:image/png;base64,AQID',
      pixels: 4,
    });
    await expect(
      loadExportAvatars(
        [1, 2],
        {
          1: { uname: 'alice', avatar: 'a' },
          2: { uname: 'bob', avatar: 'b' },
        },
        new AbortController().signal
      )
    ).resolves.toEqual({ 2: 'data:image/png;base64,AQID' });
  });
});
