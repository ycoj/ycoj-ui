import { ObjectId } from './shared';

export type Discussion = {
  _id: ObjectId;
  docId: ObjectId;

  docType: 21;
  domainId: string;
  owner: number;

  /** 父级类型 (例如: 10 代表题目, 30 代表比赛) */
  parentType: number;
  /** 父级 ID (关联的题目、比赛等的 ID) */
  parentId: ObjectId | number;

  title: string;
  content: string;
  ip?: string;
  pin: boolean;
  highlight: boolean;
  updateAt: Date;
  nReply: number;
  views: number;
  react: Record<string, number>;
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
  _id: ObjectId;
  docId: ObjectId;
  docType: number;
  domainId: string;
  owner: number;
  content: string;
  ip: string;
  edited?: boolean;
  editor?: number;
  react: Record<string, number>;
};
