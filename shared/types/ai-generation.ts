export type AiGenerationProfileOption = {
  id: string;
  label: string;
  model: string;
};

export type AiGenerationOptions = {
  enabled: boolean;
  profiles: AiGenerationProfileOption[];
  defaultProfileId: string;
  defaultTarget: number;
  maxWithoutChecker: number;
  maxWithChecker: number;
  timeLimitMs: number;
  memoryLimitMb: number;
};

export type AiGenerationCheckerRequest =
  | { mode: 'provided'; source: string }
  | { mode: 'generated'; requirements: string };

export type AiGenerateTestdataRequest = {
  profileId?: string;
  testcaseTarget?: number;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  instructions?: string;
  standardSolution?: { source: string };
  checker?: AiGenerationCheckerRequest;
};
