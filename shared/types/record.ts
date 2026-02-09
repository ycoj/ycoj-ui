export type JudgeMessageResponse = {
  message: string;
  params?: string[];
  stack?: string;
};

export type SubtaskResultResponse = {
  type: string;
  score: number;
  status: number;
};

export type TestCaseResponse = {
  id: number;
  subtaskId: number;
  score: number;
  time: number;
  memory: number;
  status: number;
  message: string;
};

export type RecordDoc = {
  _id: string;
  domainId: string;
  pid: number;
  uid: number;

  lang: string;
  code: string;

  score: number;
  memory: number;
  time: number;

  judgeTexts: Array<string | JudgeMessageResponse>;
  compilerTexts: string[];
  testCases: TestCaseResponse[];

  rejudged: boolean;
  source?: string;

  judger: number;
  judgeAt: string;
  status: number;
  progress?: number;

  input?: string;
  contest?: string;

  files?: Record<string, string>;
  subtasks?: Record<number, SubtaskResultResponse>;
};

export type RecordDict = Record<string, RecordDoc>;
