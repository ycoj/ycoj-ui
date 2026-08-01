import { clientRequest } from '@/api/client';
import type { CheckinResponse } from '@/shared/types/checkin';

export const checkin = () =>
  clientRequest.Post<CheckinResponse>('/checkin', {});
