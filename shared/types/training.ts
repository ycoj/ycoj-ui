import type { FileInfo } from './file';
import type { ObjectId } from './shared';

export type TrainingNode = {
  _id: number;
  title: string;
  requireNids: number[];
  pids: number[];
};

export type TrainingDoc = {
  docId: ObjectId;
  docType: number;
  domainId: string;
  title: string;
  content: string;
  description: string;
  owner: number;
  dag: TrainingNode[];
  attend: number;
  pin?: number;
  files?: FileInfo[];
  createdAt: Date;
  updatedAt: Date;
};

export type TrainingStatusDoc = {
  docId: ObjectId;
  uid: number;
  enroll: number;
  doneNids: number[];
  donePids: number[];
  done: boolean;
};

export type TrainingStatusDict = Record<ObjectId, TrainingStatusDoc>;

export type TrainingStatusFields = {
  doneNids: number[];
  donePids: number[];
  done: boolean;
  enroll?: number;
  attend?: number;
};

export type StatusDocBase = {
  _id: ObjectId;
  docId: ObjectId;
  docType: number;
  domainId: string;
  uid: number;
};

export type TrainingNodeStatus = {
  progress: number;
  isDone: boolean;
  isProgress: boolean;
  isOpen: boolean;
  isInvalid: boolean;
};

export type TrainingDict = Record<ObjectId, TrainingDoc>;
