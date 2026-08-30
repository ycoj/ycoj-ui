import { clientRequest } from '@/api/client';

export const postContestClarification = (
  tid: string,
  content: string,
  options?: { did?: string; subject?: number }
) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/clarification`, {
    content,
    ...(options?.did ? { did: options.did } : {}),
    ...(options?.subject === undefined ? {} : { subject: options.subject }),
  });

export const addContestUsers = (tid: string, uids: number[], unrank = false) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/user`, {
    operation: 'add_user',
    uids,
    unrank,
  });

export const toggleContestUserRank = (tid: string, uid: number) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/user`, {
    operation: 'rank',
    uid,
  });

export const resumeContestUser = (tid: string, uid: number) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/user`, {
    uid,
    operation: 'resume',
  });

export const removeContestUser = (tid: string, uid: number) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/user`, {
    uid,
    operation: 'remove_user',
  });

export const setContestBalloonColor = (tid: string, color: string) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/balloon`, {
    operation: 'set_color',
    color,
  });

export const markContestBalloonDone = (tid: string, balloon: string) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/balloon`, {
    operation: 'done',
    balloon,
  });
