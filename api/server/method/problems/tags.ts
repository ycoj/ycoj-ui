import { alova } from '@/api/server';

export type ProblemTagsResponse = Record<string, string[]>;

export const getProblemTags = () => alova.Get<ProblemTagsResponse>('/api/tags');
