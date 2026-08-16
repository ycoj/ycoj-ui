import type { ProblemDoc } from '@/shared/types/problem';
import type { AiGenerationStage, RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';

export type AiGenerationProps = {
  rdoc: RecordDoc;
  pdoc: ProblemDoc;
  udoc: User;
  allowCancel: boolean;
  onCancel: () => Promise<void>;
};

export type AiGenerationHeaderProps = {
  pdoc: ProblemDoc;
  udoc: User;
  rdoc: RecordDoc;
  stage: AiGenerationStage;
  progress: number;
  terminal: boolean;
  allowCancel: boolean;
  cancelPending: boolean;
  cancelError: string;
  onCancelClick: () => void;
};

export type AiGenerationReportProps = {
  report: string;
  caseCount: string | null;
  totalBytes: string | null;
};
