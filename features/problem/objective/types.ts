export type ObjectiveAnswers = Record<string, string | string[]>;

export type ObjectiveDraft = {
  id: string;
  answers: ObjectiveAnswers;
  updatedAt: number;
};

export type ObjectiveEventKind = 'standalone' | 'contest' | 'homework';

export type DraftIdParts = [
  userId: string | number | null,
  domainId: string,
  problemDocId: number,
  kind: ObjectiveEventKind,
  tid: string | null,
];
