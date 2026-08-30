'use client';

import type { ContestBulkSubmitResponse } from '@/api/server/method/contests/bulk-submit';
import type {
  ContestBalloonsResponse,
  ContestClarificationResponse,
  ContestManagementResponse,
  ContestUsersResponse,
} from '@/api/server/method/contests/management';
import ContestBalloons from '@/features/contest/management/contest-balloons';
import ContestBulkSubmit from '@/features/contest/management/contest-bulk-submit';
import ContestClarifications from '@/features/contest/management/contest-clarifications';
import ContestManagementOverview from '@/features/contest/management/contest-management-overview';
import ContestUsers from '@/features/contest/management/contest-users';
import type { RenderedClarificationDoc } from '@/features/contest/management/render-clarifications';

export type ContestManagementClientProps =
  | { mode: 'management'; tid: string; data: ContestManagementResponse }
  | { mode: 'user'; tid: string; data: ContestUsersResponse }
  | {
      mode: 'clarification';
      tid: string;
      data: ContestClarificationResponse;
      renderedDocs: RenderedClarificationDoc[];
    }
  | { mode: 'balloon'; tid: string; data: ContestBalloonsResponse }
  | { mode: 'bulk-submit'; tid: string; data: ContestBulkSubmitResponse };

export default function ContestManagementClient(
  props: ContestManagementClientProps
) {
  switch (props.mode) {
    case 'management':
      return <ContestManagementOverview tid={props.tid} data={props.data} />;
    case 'user':
      return <ContestUsers tid={props.tid} data={props.data} />;
    case 'clarification':
      return (
        <ContestClarifications
          tid={props.tid}
          data={props.data}
          renderedDocs={props.renderedDocs}
        />
      );
    case 'balloon':
      return <ContestBalloons tid={props.tid} data={props.data} />;
    case 'bulk-submit':
      return <ContestBulkSubmit tid={props.tid} data={props.data} />;
  }
}
