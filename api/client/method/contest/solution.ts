import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type SaveContestSolutionResponse = { sid: string };

export type SaveContestSolutionPayload = {
  title: string;
  content: string;
};

export const saveContestSolution = (
  tid: string,
  payload: SaveContestSolutionPayload,
  sid?: string
) =>
  clientRequest.Post<Errorable<SaveContestSolutionResponse>>(
    sid
      ? `/contest/${tid}/solution/${sid}/edit`
      : `/contest/${tid}/solution/create`,
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
