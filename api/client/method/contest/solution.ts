import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type CreateContestSolutionResponse = { sid: string };
export type UpdateContestSolutionResponse = { sid: string };

export type SaveContestSolutionPayload = {
  title: string;
  content: string;
};

// Hydro `contest_solution_create` accepts {title, content} and returns {sid}.
// Hydro `contest_solution_edit` accepts the same {title, content} shape and
// returns {sid}. The split wrappers keep each route's contract explicit
// instead of a unified save(tid, payload, sid?) helper.
export const createContestSolution = (
  tid: string,
  payload: SaveContestSolutionPayload
) =>
  clientRequest.Post<Errorable<CreateContestSolutionResponse>>(
    `/contest/${tid}/solution/create`,
    payload
  );

export const updateContestSolution = (
  tid: string,
  sid: string,
  payload: SaveContestSolutionPayload
) =>
  clientRequest.Post<Errorable<UpdateContestSolutionResponse>>(
    `/contest/${tid}/solution/${sid}/edit`,
    payload
  );

// Hydro handler `contest_solution_detail` serves operation=delete on the detail
// URL. Posting here (instead of the /edit handler like contest deletion) avoids
// running edit validation when no title/content is sent.
export const deleteContestSolution = (tid: string, sid: string) =>
  clientRequest.Post<Errorable<Record<string, never>>>(
    `/contest/${tid}/solution/${sid}`,
    { operation: 'delete' }
  );
