import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type DiscussionContent = string | Record<string, unknown>;

export type DiscussionReplyResponse = {
  drid?: ObjectId;
};

export type DiscussionTailReplyResponse = Record<string, never>;

export type DiscussionEditReplyResponse = Record<string, never>;

export type DiscussionDeleteReplyResponse = Record<string, never>;

export type DiscussionEditTailReplyResponse = Record<string, never>;

export type DiscussionDeleteTailReplyResponse = Record<string, never>;

export const replyDiscussion = (did: string, content: DiscussionContent) =>
  clientRequest.Post<DiscussionReplyResponse>(`/discuss/${did}`, {
    operation: 'reply',
    content,
  });

export const replyDiscussionTail = (
  did: string,
  drid: ObjectId,
  content: DiscussionContent
) =>
  clientRequest.Post<DiscussionTailReplyResponse>(`/discuss/${did}`, {
    operation: 'tail_reply',
    drid,
    content,
  });

export const editDiscussionReply = (
  did: string,
  drid: ObjectId,
  content: DiscussionContent
) =>
  clientRequest.Post<DiscussionEditReplyResponse>(`/discuss/${did}`, {
    operation: 'edit_reply',
    drid,
    content,
  });

export const deleteDiscussionReply = (did: string, drid: ObjectId) =>
  clientRequest.Post<DiscussionDeleteReplyResponse>(`/discuss/${did}`, {
    operation: 'delete_reply',
    drid,
  });

export const editDiscussionTailReply = (
  did: string,
  drid: ObjectId,
  drrid: ObjectId,
  content: DiscussionContent
) =>
  clientRequest.Post<DiscussionEditTailReplyResponse>(`/discuss/${did}`, {
    operation: 'edit_tail_reply',
    drid,
    drrid,
    content,
  });

export const deleteDiscussionTailReply = (
  did: string,
  drid: ObjectId,
  drrid: ObjectId
) =>
  clientRequest.Post<DiscussionDeleteTailReplyResponse>(`/discuss/${did}`, {
    operation: 'delete_tail_reply',
    drid,
    drrid,
  });
