import type { FileInfo } from './file';
import type { Homework } from './homework';
import type { ProblemDict } from './problem';
import type { BaseUserDict } from './user';

export type ContestRule =
  'acm' | 'oi' | 'homework' | 'ioi' | 'ledo' | 'strictioi';

export type BaseContest = {
  _id: string;
  docId: string;
  docType: 30;
  domainId: string;
  owner: number;
  maintainer?: number[];
  beginAt: Date;
  endAt: Date;
  /** 参加人数 */
  attend: number;
  title: string;
  content: string;
  rule: ContestRule;
  pids: number[];
  rated?: boolean;
  assign?: string[];
  langs?: string[];
  /** Public attachments available to `file://` references in the contest content. */
  files?: FileInfo[];
};

export type Contest = {
  rule: Exclude<ContestRule, 'homework'>;

  /** ACM 赛制封榜时间 */
  lockAt?: Date;
  unlocked?: boolean;
  /** 气球发放状态记录 */
  balloon?: Record<number, string>;

  /** 自动隐藏或解除隐藏题目 */
  autoHide?: boolean;
  /** 排行榜是否显示真实用户名 */
  showUsername?: boolean;
  /** 比赛有效时长 (小时)，用于灵活时间窗口模式 */
  duration: number;
  /** 参加所需的最低 Rating */
  minRating?: number;
  /** 参加允许的最高 Rating */
  maxRating?: number;
  /** 比赛结束后是否允许查看他人代码 */
  allowViewCode?: boolean;
  /** Invitation code required to attend. */
  _code?: string;
  keepScoreboardHidden?: boolean;
  allowPrint?: boolean;
} & BaseContest; // 比赛

export const CONTEST_RULES: ContestRule[] = [
  'acm',
  'oi',
  'ioi',
  'ledo',
  'homework',
  'strictioi',
];

export type ContestStatus = {
  attend?: number;
  subscribe?: number;
  startAt?: Date;
  endAt?: Date;
  detail?: Record<number, Record<string, unknown>>;
};

export type ContestListProjection = {
  _id: string;
  domainId: string;
  docId: string;
  title: string;
  content: string;
  owner: number;
  rule: ContestRule;
  beginAt: Date;
  endAt: Date;
  pids: number[];
  assign: string[];
  maintainer: number[];
  rated?: boolean;
  lockAt?: Date;
  attend: number;
  penalty?: number;
  codeFamilyLimit?: string;
  lasted?: number;
  viewCtx?: Record<string, unknown>;
  allowRevive?: boolean;
  autoHide?: boolean;
  hideProgress?: boolean;
  pinned?: boolean;
};

export type ContestStatusDict = Record<string, ContestStatus>;

export type ContestClarificationDoc = {
  _id: string;
  docId: string;
  content: string;
  owner: number;
  important: boolean;
  _cat: number;
};

// Scoreboard types

export type ScoreboardNodeType =
  | 'rank'
  | 'user'
  | 'email'
  | 'solved'
  | 'total_score'
  | 'time'
  | 'problem'
  | 'record'
  | 'records'
  | 'string';

export type ScoreboardNode = {
  type: ScoreboardNodeType;
  value: string | number;
  raw?: unknown;
  score?: number;
  first?: boolean;
  style?: string;
  hover?: string;
};

export type ScoreboardRow = ScoreboardNode[] & { raw?: unknown };

export type GDoc = {
  _id: string;
  name: string;
  uids?: number[];
};

export type ScoreboardResponse = {
  tdoc: Contest | Homework;
  tsdoc: ContestStatus | null;
  rows: ScoreboardRow[];
  udict: BaseUserDict;
  pdict: ProblemDict;
  groups: GDoc[];
  availableViews?: Record<string, string>;
};
