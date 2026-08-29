import ContestManagementClient from './contest-management-client';
import ContestManagementSidebar from './contest-management-sidebar';
import type { ContestBulkSubmitResponse } from '@/api/server/method/contests/bulk-submit';
import type {
  ContestManagementResponse,
  ContestClarificationResponse,
  ContestUsersResponse,
  ContestBalloonsResponse,
} from '@/api/server/method/contests/management';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { BaseUser } from '@/shared/types/user';

type Props = {
  mode: 'management' | 'user' | 'clarification' | 'balloon' | 'bulk-submit';
  tid: string;
  data:
    | ContestManagementResponse
    | ContestClarificationResponse
    | ContestUsersResponse
    | ContestBalloonsResponse
    | ContestBulkSubmitResponse;
  owner?: BaseUser;
};

export default function ContestManagementPage({
  mode,
  tid,
  data,
  owner,
}: Props) {
  return (
    <TwoColumnLayout
      ratio="8-2"
      left={
        <ContestManagementClient mode={mode} tid={tid} data={data as never} />
      }
      right={
        <ContestManagementSidebar tid={tid} contest={data.tdoc} owner={owner} />
      }
    />
  );
}
