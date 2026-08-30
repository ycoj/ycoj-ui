import type { BaseUserDict } from '@/shared/types/user';

export const REALNAME_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type RealnameStatus = (typeof REALNAME_STATUSES)[number];
export type RealnameUserStatus = RealnameStatus | 'none';

export type RealnameApplication = {
  _id: string;
  uid: number;
  realName: string;
  school: string;
  status: RealnameStatus;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  rejectReason?: string;
};

export type BackendRedirect = { url: string };

export type RealnamePageData = {
  page_name: 'home_realname';
  status: RealnameUserStatus;
  exempt: boolean;
  application: RealnameApplication | null;
  inGrace: boolean;
  graceUntil: string | null;
  realName: string;
  school: string;
};

export type RealnameResultData = {
  page_name: 'home_realname_result';
  status: RealnameUserStatus;
  exempt: boolean;
  application: RealnameApplication | null;
  inGrace: boolean;
  graceUntil: string | null;
};

export type RealnameFilterStatus = RealnameStatus | 'all';

export type RealnameManageData = {
  page_name: 'manage_realname';
  rdocs: RealnameApplication[];
  udict: BaseUserDict;
  page: number;
  numPages: number;
  count: number;
  filterStatus: RealnameFilterStatus;
  filterUname: string;
};

export type SubmitRealnameRequest = {
  realName: string;
  school: string;
};

export type ReviewRealnameRequest =
  | { operation: 'approve'; id: string }
  | { operation: 'reject'; id: string; reason?: string }
  | { operation: 'revoke'; id: string; reason?: string };
