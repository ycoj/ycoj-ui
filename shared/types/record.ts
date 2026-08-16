export type JudgeMessageResponse = {
  message: string;
  params?: Array<string | number>;
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
  message: string | JudgeMessageResponse;
};

export type AiGenerationStage =
  | 'waiting'
  | 'preparing'
  | 'agent'
  | 'validating'
  | 'replacing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AiGenerationMeta = {
  active: boolean;
  stage: AiGenerationStage;
  model: string;
  sessionId?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type AiTraceEventType =
  | 'generation'
  | 'preparation'
  | 'agent_turn'
  | 'tool'
  | 'validation'
  | 'replacement';

export type AiTraceState =
  'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out';

export type AiTraceMessage = {
  schema: 'hydro.ai-generation.trace';
  version: 1;
  seq: number;
  type: AiTraceEventType;
  state: AiTraceState;
  startedAt: string;
  finishedAt?: string;
  data: Record<string, unknown>;
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
  aiGeneration?: AiGenerationMeta;
};

/** Fields returned by Hydro's record list projection. */
export type RecordListItem = Pick<
  RecordDoc,
  | '_id'
  | 'domainId'
  | 'pid'
  | 'uid'
  | 'lang'
  | 'score'
  | 'memory'
  | 'time'
  | 'rejudged'
  | 'progress'
  | 'judger'
  | 'judgeAt'
  | 'status'
  | 'source'
  | 'contest'
  | 'files'
  | 'aiGeneration'
>;

export type RecordDict = Record<string, RecordDoc>;
