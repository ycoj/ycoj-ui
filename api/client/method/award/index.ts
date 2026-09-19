import { clientRequest } from '@/api/client';
import type { AwardMutationResponse } from '@/shared/types/award';

export const bindAward = (oierId: number) =>
  clientRequest.Post<AwardMutationResponse>('/home/award', { oierId });

export const unbindAward = (uid: number) =>
  clientRequest.Post<AwardMutationResponse>('/manage/award', {
    operation: 'unbind',
    uid,
  });

const Award = { bindAward, unbindAward };
export default Award;
