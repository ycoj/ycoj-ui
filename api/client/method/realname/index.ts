import { clientRequest } from '@/api/client';
import type {
  BackendRedirect,
  ReviewRealnameRequest,
  SubmitRealnameRequest,
} from '@/shared/types/realname';

export const submitRealname = (payload: SubmitRealnameRequest) =>
  clientRequest.Post<BackendRedirect>('/home/realname', payload);

export const reviewRealname = (payload: ReviewRealnameRequest) =>
  clientRequest.Post<BackendRedirect>('/manage/realname', payload);

const Realname = {
  submitRealname,
  reviewRealname,
};

export default Realname;
