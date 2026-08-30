import { alova } from '@/api/server';
import type {
  BackendRedirect,
  RealnameFilterStatus,
  RealnameManageData,
  RealnamePageData,
  RealnameResultData,
} from '@/shared/types/realname';

export const getRealnamePage = () =>
  alova.Get<RealnamePageData | BackendRedirect>('/home/realname');

export const getRealnameResult = () =>
  alova.Get<RealnameResultData | BackendRedirect>('/home/realname/result');

export const getRealnameApplications = (
  page = 1,
  status: RealnameFilterStatus = 'pending'
) =>
  alova.Get<RealnameManageData>('/manage/realname', {
    params: { page, status },
  });

const Realname = {
  getRealnamePage,
  getRealnameResult,
  getRealnameApplications,
};

export default Realname;
