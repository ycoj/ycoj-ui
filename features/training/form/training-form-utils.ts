import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import type { CreateTrainingRequest } from '@/api/client/method/training/create';
import type { TrainingDoc } from '@/shared/types/training';

export type TrainingSectionValue = {
  id: number;
  title: string;
  requireNids: number[];
  pids: ProblemAutoCompleteItem[];
};

export type TrainingFormValues = {
  title: string;
  pin: string;
  content: string;
  description: string;
  sections: TrainingSectionValue[];
};

export function getTrainingCreateDefaults(): TrainingFormValues {
  return {
    title: '',
    pin: '0',
    content: '',
    description: '',
    sections: [{ id: 1, title: '', requireNids: [], pids: [] }],
  };
}

export function buildTrainingPayload(
  values: TrainingFormValues
): CreateTrainingRequest {
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    description: values.description.trim(),
    pin: Number(values.pin) || 0,
    dag: JSON.stringify(
      values.sections.map((section) => ({
        _id: section.id,
        title: section.title.trim(),
        requireNids: Array.from(new Set(section.requireNids)),
        pids: section.pids.map((problem) => problem.docId),
      }))
    ),
  };
}

type TrainingEditSource = Pick<
  TrainingDoc,
  'title' | 'content' | 'description' | 'pin'
>;

export function mapTrainingEditToFormValues(
  tdoc: TrainingEditSource,
  sections: TrainingSectionValue[]
): TrainingFormValues {
  return {
    title: tdoc.title,
    pin: String(tdoc.pin ?? 0),
    content: tdoc.content ?? '',
    description: tdoc.description ?? '',
    sections,
  };
}

export function getNextSectionId(sections: { id: number }[]): number {
  return sections.reduce((max, section) => Math.max(max, section.id), 0) + 1;
}

export function allocateNextSectionId(
  lastAllocated: number,
  sections: { id: number }[]
): number {
  return Math.max(lastAllocated + 1, getNextSectionId(sections));
}

export function hasDuplicateSectionIds(sections: { id: number }[]): boolean {
  return (
    new Set(sections.map((section) => section.id)).size !== sections.length
  );
}

export function hasInvalidRequireNids(
  section: { id: number; requireNids: number[] },
  sections: { id: number }[]
): boolean {
  const ids = new Set(sections.map((item) => item.id));
  return section.requireNids.some((nid) => nid === section.id || !ids.has(nid));
}

export function hasCyclicRequireNids(
  sections: { id: number; requireNids: number[] }[]
): boolean {
  const graph = new Map(
    sections.map((section) => [section.id, section.requireNids])
  );
  const visiting = new Set<number>();
  const visited = new Set<number>();

  const visit = (id: number): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const prerequisite of graph.get(id) ?? []) {
      if (graph.has(prerequisite) && visit(prerequisite)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return sections.some((section) => visit(section.id));
}
