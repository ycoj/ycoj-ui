export type BaseUser = {
  _id: number;
  uname: string;
  mail: string;
  avatar: string;
  /** Optional fields that may be present depending on settings/context */
  school?: string;
  displayName?: string;
  studentId?: string;
  /** 其他自定义字段 */
  [key: string]: unknown;
};

export type BaseUserDict = Record<number, BaseUser>;

export type RpInfo = {
  /** 通过做题获得的 RP */
  problem?: number;
  /** 通过贡献题目/题解获得的 RP */
  contribute?: number;
  /** 通过参加比赛获得的 RP */
  contest?: number;
  /** 获奖认证转换的 RP */
  awards?: number;
  /** RP 增量/修正值 */
  delta?: number;
  /** 允许通过插件扩展其他类型的 RP */
  [key: string]: number | undefined;
};

export type User = BaseUser & {
  unreadMsg?: number;
  badge?: string;
  /** Serialized BigInt (e.g. "BigInt::123") */
  perm: string;
  role: string;
  priv: number;
  /** ISO Date string */
  regat: string;
  /** ISO Date string */
  loginat: string;
  tfa: boolean;
  authn: boolean;
  ccfLevel?: number;
  modType?: 'su' | 'mod' | null;
  timeZone?: string;
  backgroundImage?: string;
  bio?: string;
  codeLang?: string;
  codeTemplate?: string;
  realnameStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  realnameSubmittedAt?: string;
  realName?: string;
  realnameSchool?: string;
  rank?: number;
  rp?: number;
  rpInfo?: RpInfo;
  nAccept?: number;
  nSubmit?: number;
  level?: number;
  uojRating?: number;
  bgCard?: string;
};
