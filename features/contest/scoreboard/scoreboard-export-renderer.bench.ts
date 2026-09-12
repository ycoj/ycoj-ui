// @vitest-environment node
import { buildScoreboardSvg, type ExportLabels } from './scoreboard-export-svg';
import type {
  ScoreboardExportData,
  ScoreboardExportOptions,
  ScoreboardRow,
} from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import { renderAsync } from '@resvg/resvg-js';
import path from 'node:path';
import { bench, describe } from 'vitest';

// Rasterizing one image with the CJK font takes seconds, so the heavy cases run
// explicitly: `SCOREBOARD_EXPORT_BENCH=1 pnpm exec vitest bench --run <file>`.
const runRasterization = process.env.SCOREBOARD_EXPORT_BENCH === '1';
const font = path.join(process.cwd(), 'assets/fonts/NotoSansCJKsc-Regular.otf');
const labels: ExportLabels = {
  details: '提交详情',
  noSubmissions: '暂无提交记录',
  columns: ['编号', '题目', '时间', '状态', '分数', '语言'],
  statuses: {
    accepted: 'Accepted',
    wrongAnswer: 'Wrong answer',
    timeLimitExceeded: 'Time limit exceeded',
    runtimeError: 'Runtime error',
  },
};

function makeData(
  participants: number,
  problems: number,
  submissions: number
): ScoreboardExportData {
  const header: ScoreboardRow = [
    { type: 'rank', value: '#' },
    { type: 'user', value: '选手' },
    ...Array.from({ length: problems }, (_, index): ScoreboardRow[number] => ({
      type: 'problem',
      raw: 1000 + index,
      value: String.fromCharCode(65 + index),
    })),
  ];
  const rows: ScoreboardRow[] = [header];
  const udict: ScoreboardExportData['udict'] = {};
  const pdict = {} as ProblemDict;
  const submissionsMap: NonNullable<ScoreboardExportData['submissions']> = {};
  for (let uid = 1; uid <= participants; uid++) {
    udict[uid] = { uname: `参赛者-${uid}`, avatar: '' };
    rows.push([
      { type: 'rank', value: uid },
      { type: 'user', raw: uid, value: `参赛者-${uid}` },
      ...Array.from({ length: problems }, (_, index): ScoreboardRow[number] => {
        const value =
          index % 3 === 0
            ? `<span class="icon icon-check"></span>\n${index}:1${index}`
            : index % 3 === 1
              ? '-1 <span style="color:orange">+2</span>'
              : '0';
        return {
          type: 'record',
          value,
          score: [100, 60, 30, 0][index % 4],
          first: index === 2,
        };
      }),
    ]);
    submissionsMap[uid] = Array.from({ length: submissions }, (_, index) => ({
      rid: `R${uid}-${index}`,
      pid: 1000 + (index % problems),
      status:
        index % 4 === 0 ? 1 : index % 4 === 1 ? 2 : index % 4 === 2 ? 3 : 4,
      score: [100, 0, 60, 30][index % 4],
      submittedAt: '2026-09-01T00:00:00Z',
      lang: 'cpp',
    }));
  }
  for (let index = 0; index < problems; index++)
    pdict[1000 + index] = {
      title: `题目 ${String.fromCharCode(65 + index)} 的一个较长的中文名称`,
    } as ProblemDict[number];
  return {
    tdoc: {
      title: '2026 年秋季算法竞赛（复赛）',
    } as ScoreboardExportData['tdoc'],
    rows,
    udict,
    pdict,
    submissions: submissionsMap,
  };
}

const overviewOptions: ScoreboardExportOptions = {
  avatar: false,
  realName: false,
  details: false,
};
const detailOptions: ScoreboardExportOptions = {
  avatar: false,
  realName: false,
  details: true,
};
const overviewFixtures = [60, 120, 180].map((participants) => {
  const data = makeData(participants, 10, 0);
  return {
    participants,
    data,
    svg: buildScoreboardSvg(data, overviewOptions, labels, {}),
  };
});
const detailData = makeData(20, 10, 20);
const detailSvg = buildScoreboardSvg(detailData, detailOptions, labels, {}, 1);
const renderOptions = {
  font: {
    loadSystemFonts: false,
    fontFiles: [font],
    defaultFontFamily: 'Noto Sans CJK SC',
  },
};

const sink: { value: unknown } = { value: undefined };

describe('buildScoreboardSvg', () => {
  for (const { participants, data } of overviewFixtures)
    bench(`overview - ${participants} participants, 10 problems`, () => {
      sink.value = buildScoreboardSvg(data, overviewOptions, labels, {});
    });
  bench('participant details - 20 submissions', () => {
    sink.value = buildScoreboardSvg(detailData, detailOptions, labels, {}, 1);
  });
});

describe('renderAsync', () => {
  const singleRun = { iterations: 1, warmupIterations: 0, warmupTime: 0 };
  for (const { participants, svg } of overviewFixtures)
    bench.skipIf(!runRasterization)(
      `overview - ${participants} participants`,
      async () => {
        sink.value = (await renderAsync(svg, renderOptions)).asPng();
      },
      singleRun
    );
  bench.skipIf(!runRasterization)(
    'participant details - 20 submissions',
    async () => {
      sink.value = (await renderAsync(detailSvg, renderOptions)).asPng();
    },
    singleRun
  );
});
