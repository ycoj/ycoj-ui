import { alova } from '@/api/server';
import type { AwardManageData, AwardPageData } from '@/shared/types/award';

export const getAwardPage = (page = 1, others = false) =>
  alova.Get<AwardPageData>('/home/award', {
    params: { page, ...(others ? { others: '1' } : {}) },
  });

export const getAwardManagement = (page = 1, uname = '') =>
  alova.Get<AwardManageData>('/manage/award', {
    params: { page, ...(uname ? { uname } : {}) },
  });

const Award = { getAwardPage, getAwardManagement };
export default Award;
