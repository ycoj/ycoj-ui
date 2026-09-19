import type { BaseUserDict } from './user';
import type { AwardRecord } from '@/api/server/method/user/detail';

export type { AwardRecord } from '@/api/server/method/user/detail';

export type AwardContestant = {
  _id: number;
  name: string;
  ccfLevel: number;
  ccfScore: number;
  schools: string[];
  latestSchool: string;
  recordCount: number;
  uid?: number;
};

export type AwardPageData = {
  page_name: 'home_award';
  verified: boolean;
  bound: (AwardContestant & { uid: number }) | null;
  records: AwardRecord[];
  oiers: AwardContestant[];
  previews: Record<number, AwardRecord[]>;
  page: number;
  numPages: number;
  showingOthers: boolean;
  realName: string;
  school: string;
};

export type AwardManageData = {
  page_name: 'manage_award';
  odocs: Array<AwardContestant & { uid: number }>;
  udict: BaseUserDict;
  page: number;
  numPages: number;
  count: number;
  filterUname: string;
};

export type AwardMutationResponse = { url: string };
