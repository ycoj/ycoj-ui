// @vitest-environment node
import { buildScoreboardSvg, type ExportLabels } from './scoreboard-export-svg';
import type {
  ScoreboardExportData,
  ScoreboardExportOptions,
  ScoreboardRow,
} from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import { bench, describe } from 'vitest';

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

function makeOverview(
  participants: number,
  problems: number
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
  };
}

const data = makeOverview(120, 10);
const options: ScoreboardExportOptions = {
  avatar: false,
  realName: false,
  details: false,
};
const sink: { value: unknown } = { value: undefined };

describe('buildScoreboardSvg', () => {
  bench('overview - 120 participants, 10 problems', () => {
    sink.value = buildScoreboardSvg(data, options, labels, {});
  });
});
