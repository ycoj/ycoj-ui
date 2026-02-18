import type { Contest } from './contest';
import type { Homework } from './homework';
import type { ProblemDoc } from './problem';
import { ObjectId } from './shared';
import type { TrainingDoc } from './training';

export type Discussion = {
  _id: ObjectId;
  docId: ObjectId;

  docType: 21;
  domainId: string;
  owner: number;

  /** 父级类型 (例如: 10 代表题目, 30 代表比赛) */
  parentType: number;
  /** 父级 ID (关联的题目、比赛等的 ID) */
  parentId: ObjectId | number | string;

  title: string;
  content: string;
  ip?: string;
  pin: boolean;
  highlight: boolean;
  updateAt: Date;
  nReply: number;
  views: number;
  edited?: boolean;
  editor?: number;
  react: Record<string, number>;
  sort?: number;
  lastRCount?: number;
  lock?: boolean;
  hidden?: boolean;
};

export type Node = {
  title: string;
  _id: ObjectId;
  content: string;
  domainId: string;
  docId: string;
  docType: 20;
  type: 20;
  id: string;
};

export type DiscussionReplyDoc = {
  docId: ObjectId;
  docType: number;
  _id?: ObjectId;
  domainId?: string;
  owner?: number;
  parentType?: number;
  parentId?: ObjectId;
  content: string;
  ip: string;
  reply?: DiscussionTailReplyDoc[];
  edited?: boolean;
  editor?: number;
  react: Record<string, number>;
};

export type DiscussionStatus = {
  star?: boolean;
  view?: boolean;
  react?: Record<string, number>;
};

export type DiscussionDoc = Discussion;

export type DiscussionTailReplyDoc = {
  _id: ObjectId;
  owner: number;
  content: string;
  ip: string;
  edited?: boolean;
  editor?: number;
};

export type DiscussionDetailVnode =
  | ProblemDoc
  | Contest
  | Homework
  | TrainingDoc
  | Node
  | Record<string, unknown>;
