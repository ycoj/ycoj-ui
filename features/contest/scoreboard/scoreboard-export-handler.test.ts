// @vitest-environment node
import { handleScoreboardExport } from './scoreboard-export-handler';
import { renderScoreboardFile } from './scoreboard-export-renderer';
import ServerApis from '@/api/server/method';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/server/method', () => ({
  default: { Contests: { getScoreboardExportData: vi.fn() } },
}));
vi.mock('./scoreboard-export-renderer', () => ({
  renderScoreboardFile: vi.fn(),
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));
const params = { pageType: 'contest', tid: '665f00000000000000000001' };
const request = (query = '') =>
  new Request(
    `http://localhost/api/scoreboard-export/contest/${params.tid}${query}`
  );
beforeEach(() => {
  vi.mocked(ServerApis.Contests.getScoreboardExportData)
    .mockReset()
    .mockResolvedValue({
      rows: [],
      udict: {},
      pdict: {},
      tdoc: { title: 'Contest' },
      tsdoc: null,
      groups: [],
    } as never);
  vi.mocked(renderScoreboardFile)
    .mockReset()
    .mockResolvedValue({
      body: Buffer.from('png'),
      filename: '中文.png',
      contentType: 'image/png',
    });
});
describe('Next export route', () => {
  it('validates route and boolean parameters before loading data', async () => {
    expect(
      (await handleScoreboardExport(request('?details=garbage'), params)).status
    ).toBe(400);
    expect(
      (
        await handleScoreboardExport(request(), {
          ...params,
          pageType: '../user',
        })
      ).status
    ).toBe(400);
    expect(ServerApis.Contests.getScoreboardExportData).not.toHaveBeenCalled();
  });
  it('does not render unauthorized exports', async () => {
    vi.mocked(ServerApis.Contests.getScoreboardExportData).mockResolvedValue({
      error: { name: 'PermissionError', message: 'Forbidden' },
    });
    const response = await handleScoreboardExport(
      request('?details=true'),
      params
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(renderScoreboardFile).not.toHaveBeenCalled();
  });
  it('returns an uncached attachment and passes export options to the backend and renderer', async () => {
    const response = await handleScoreboardExport(
      request('?realName=true&avatar=true'),
      params
    );
    expect(ServerApis.Contests.getScoreboardExportData).toHaveBeenCalledWith(
      'contest',
      params.tid,
      { realName: true, avatar: true, details: false }
    );
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('content-disposition')).toContain(
      encodeURIComponent('中文.png')
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).toBe('png');
  });
});
