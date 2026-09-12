// @vitest-environment node
import {
  MAX_EXPORT_PARTICIPANTS,
  renderScoreboardFile,
} from './scoreboard-export-renderer';
import { buildScoreboardSvg, type ExportLabels } from './scoreboard-export-svg';
import type { ScoreboardImageData } from './scoreboard-export-utils';
import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';

const data: ScoreboardImageData = {
  tdoc: { title: '测试 <script> & contest' } as ScoreboardImageData['tdoc'],
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
    expect(Object.keys(zip.files)).toEqual(['2-张三.png', '3-张三.png']);
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
    } as ScoreboardImageData;
    await expect(
      renderScoreboardFile(
        oversizedData,
        { ...options, details: false },
        labels,
        new AbortController().signal
      )
    ).rejects.toThrow('participant limit');
  });
});
