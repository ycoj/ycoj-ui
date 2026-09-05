import type { User } from '@/shared/types/user';

export const PERM = {
  PERM_NONE: BigInt(0),

  // Domain Settings
  PERM_VIEW: BigInt(1) << BigInt(0),
  PERM_EDIT_DOMAIN: BigInt(1) << BigInt(1),
  PREM_VIEW_DISPLAYNAME: BigInt(1) << BigInt(67),
  PERM_MOD_BADGE: BigInt(1) << BigInt(2),

  // Problem
  PERM_CREATE_PROBLEM: BigInt(1) << BigInt(4),
  PERM_EDIT_PROBLEM: BigInt(1) << BigInt(5),
  PERM_EDIT_PROBLEM_SELF: BigInt(1) << BigInt(6),
  PERM_VIEW_PROBLEM: BigInt(1) << BigInt(7),
  PERM_VIEW_PROBLEM_HIDDEN: BigInt(1) << BigInt(8),
  PERM_SUBMIT_PROBLEM: BigInt(1) << BigInt(9),
  PERM_READ_PROBLEM_DATA: BigInt(1) << BigInt(10),

  // Record
  PERM_READ_RECORD_CODE: BigInt(1) << BigInt(12),
  PERM_READ_RECORD_CODE_ACCEPT: BigInt(1) << BigInt(66),
  PERM_REJUDGE_PROBLEM: BigInt(1) << BigInt(13),
  PERM_REJUDGE: BigInt(1) << BigInt(14),

  // Problem Solution
  PERM_VIEW_PROBLEM_SOLUTION: BigInt(1) << BigInt(15),
  PERM_VIEW_PROBLEM_SOLUTION_ACCEPT: BigInt(1) << BigInt(65),
  PERM_CREATE_PROBLEM_SOLUTION: BigInt(1) << BigInt(16),
  PERM_VOTE_PROBLEM_SOLUTION: BigInt(1) << BigInt(17),
  PERM_EDIT_PROBLEM_SOLUTION: BigInt(1) << BigInt(18),
  PERM_EDIT_PROBLEM_SOLUTION_SELF: BigInt(1) << BigInt(19),
  PERM_DELETE_PROBLEM_SOLUTION: BigInt(1) << BigInt(20),
  PERM_DELETE_PROBLEM_SOLUTION_SELF: BigInt(1) << BigInt(21),
  PERM_REPLY_PROBLEM_SOLUTION: BigInt(1) << BigInt(22),
  PERM_EDIT_PROBLEM_SOLUTION_REPLY_SELF: BigInt(1) << BigInt(24),
  PERM_DELETE_PROBLEM_SOLUTION_REPLY: BigInt(1) << BigInt(25),
  PERM_DELETE_PROBLEM_SOLUTION_REPLY_SELF: BigInt(1) << BigInt(26),

  // Discussion
  PERM_VIEW_DISCUSSION: BigInt(1) << BigInt(27),
  PERM_CREATE_DISCUSSION: BigInt(1) << BigInt(28),
  PERM_HIGHLIGHT_DISCUSSION: BigInt(1) << BigInt(29),
  PERM_PIN_DISCUSSION: BigInt(1) << BigInt(61),
  PERM_EDIT_DISCUSSION: BigInt(1) << BigInt(30),
  PERM_EDIT_DISCUSSION_SELF: BigInt(1) << BigInt(31),
  PERM_DELETE_DISCUSSION: BigInt(1) << BigInt(32),
  PERM_DELETE_DISCUSSION_SELF: BigInt(1) << BigInt(33),
  PERM_REPLY_DISCUSSION: BigInt(1) << BigInt(34),
  PERM_ADD_REACTION: BigInt(1) << BigInt(62),
  PERM_EDIT_DISCUSSION_REPLY_SELF: BigInt(1) << BigInt(36),
  PERM_DELETE_DISCUSSION_REPLY: BigInt(1) << BigInt(38),
  PERM_DELETE_DISCUSSION_REPLY_SELF: BigInt(1) << BigInt(39),
  PERM_DELETE_DISCUSSION_REPLY_SELF_DISCUSSION: BigInt(1) << BigInt(40),
  PERM_LOCK_DISCUSSION: BigInt(1) << BigInt(64),

  // Contest
  PERM_VIEW_CONTEST: BigInt(1) << BigInt(41),
  PERM_VIEW_CONTEST_SCOREBOARD: BigInt(1) << BigInt(42),
  PERM_VIEW_CONTEST_HIDDEN_SCOREBOARD: BigInt(1) << BigInt(43),
  PERM_CREATE_CONTEST: BigInt(1) << BigInt(44),
  PERM_ATTEND_CONTEST: BigInt(1) << BigInt(45),
  PERM_EDIT_CONTEST: BigInt(1) << BigInt(50),
  PERM_EDIT_CONTEST_SELF: BigInt(1) << BigInt(51),
  PERM_VIEW_HIDDEN_CONTEST: BigInt(1) << BigInt(68),

  // Homework
  PERM_VIEW_HOMEWORK: BigInt(1) << BigInt(52),
  PERM_VIEW_HOMEWORK_SCOREBOARD: BigInt(1) << BigInt(53),
  PERM_VIEW_HOMEWORK_HIDDEN_SCOREBOARD: BigInt(1) << BigInt(54),
  PERM_CREATE_HOMEWORK: BigInt(1) << BigInt(55),
  PERM_ATTEND_HOMEWORK: BigInt(1) << BigInt(56),
  PERM_EDIT_HOMEWORK: BigInt(1) << BigInt(57),
  PERM_EDIT_HOMEWORK_SELF: BigInt(1) << BigInt(58),
  PERM_VIEW_HIDDEN_HOMEWORK: BigInt(1) << BigInt(69),

  // Training
  PERM_VIEW_TRAINING: BigInt(1) << BigInt(46),
  PERM_CREATE_TRAINING: BigInt(1) << BigInt(47),
  PERM_EDIT_TRAINING: BigInt(1) << BigInt(48),
  PERM_PIN_TRAINING: BigInt(1) << BigInt(63),
  PERM_EDIT_TRAINING_SELF: BigInt(1) << BigInt(49),

  // Ranking
  PERM_VIEW_RANKING: BigInt(1) << BigInt(59),

  // Placeholder
  PERM_ALL: BigInt(-1),
  PERM_BASIC: BigInt(0),
  PERM_DEFAULT: BigInt(0),
  PERM_ADMIN: BigInt(-1),

  PERM_NEVER: BigInt(1) << BigInt(60),
} as const;

export const PRIV = {
  PRIV_NONE: 0,
  PRIV_MOD_BADGE: 1 << 25,
  PRIV_EDIT_SYSTEM: 1 << 0, // renamed from PRIV_SET_PRIV
  PRIV_SET_PERM: 1 << 1,
  PRIV_USER_PROFILE: 1 << 2,
  PRIV_REGISTER_USER: 1 << 3,
  PRIV_READ_PROBLEM_DATA: 1 << 4,
  PRIV_READ_RECORD_CODE: 1 << 7,
  PRIV_VIEW_HIDDEN_RECORD: 1 << 8,
  PRIV_JUDGE: 1 << 9, // (renamed)
  PRIV_CREATE_DOMAIN: 1 << 10,
  PRIV_VIEW_ALL_DOMAIN: 1 << 11,
  PRIV_MANAGE_ALL_DOMAIN: 1 << 12,
  PRIV_REJUDGE: 1 << 13,
  PRIV_VIEW_USER_SECRET: 1 << 14,
  PRIV_VIEW_JUDGE_STATISTICS: 1 << 15,
  PRIV_UNLIMITED_ACCESS: 1 << 22,
  PRIV_VIEW_SYSTEM_NOTIFICATION: 1 << 23,
  PRIV_SEND_MESSAGE: 1 << 24,
  PRIV_CREATE_FILE: 1 << 16,
  PRIV_UNLIMITED_QUOTA: 1 << 17,
  PRIV_DELETE_FILE: 1 << 18,

  PRIV_ALL: -1,
  PRIV_DEFAULT: 0,
  PRIV_NEVER: 1 << 20,
} as const;

export function hasPerm(user: User | null | undefined, perm: bigint) {
  if (!user) return false;
  const currentPerm = BigInt(user.perm.replace('BigInt::', ''));
  return (perm & currentPerm) === perm;
}

export function hasPriv(user: User | null | undefined, priv: number) {
  if (!user) return false;
  return (user.priv & priv) === priv;
}
