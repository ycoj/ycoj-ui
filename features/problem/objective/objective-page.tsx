import ContestTimer from '@/features/contest/contest-timer';
import type { ProblemDetailData } from '@/features/problem/detail/get-problem-detail';
import ProblemContent from '@/features/problem/detail/problem-content';
import ProblemTitle from '@/features/problem/detail/problem-title';
import {
  getDraftId,
  getEventKind,
} from '@/features/problem/objective/draft-utils';
import ObjectiveNavigation from '@/features/problem/objective/navigation';
import ObjectiveProvider from '@/features/problem/objective/provider';
import { ObjectiveStatementFooter } from '@/features/problem/objective/workspace';
import ProblemSidebar from '@/features/problem/sidebar';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { User } from '@/shared/types/user';

type Props = {
  data: ProblemDetailData;
  tid?: string;
  canConfigure: boolean;
  user: User | null;
};

export function ObjectiveProblemPage({ data, tid, canConfigure, user }: Props) {
  const isReadOnly = data.mode !== 'normal' && data.mode !== 'contest';
  const isGuest = !user?._id;
  const canSubmit = !!user && hasPerm(user, PERM.PERM_SUBMIT_PROBLEM);
  const eventKind = getEventKind(data.tdoc);
  const pid = data.pdoc.pid ?? String(data.pdoc.docId);
  const draftId = getDraftId(
    user?._id ?? null,
    data.pdoc.domainId,
    data.pdoc.docId,
    eventKind,
    tid ?? null
  );

  return (
    <ObjectiveProvider key={draftId} draftId={draftId} isReadOnly={isReadOnly}>
      <div className="space-y-6">
        {data.tdoc && <ContestTimer contest={data.tdoc} status={data.tsdoc} />}
        <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
        <TwoColumnLayout
          ratio="8-2"
          left={
            <div className="space-y-4">
              <ProblemContent problem={data.pdoc} tid={tid} objective />
              <ObjectiveStatementFooter
                pid={pid}
                tid={tid ?? null}
                isGuest={isGuest}
                canSubmit={canSubmit}
                isReadOnly={isReadOnly}
                eventRule={data.tdoc?.rule}
              />
            </div>
          }
          right={
            <ProblemSidebar
              allowSubmit={false}
              discussionCount={data.discussionCount}
              solutionCount={data.solutionCount}
              problem={data.pdoc}
              tid={tid}
              contest={data.tdoc}
              contestStatus={data.tsdoc}
              allowConfigure={canConfigure}
              objectiveSlot={<ObjectiveNavigation />}
            />
          }
        />
      </div>
    </ObjectiveProvider>
  );
}

export default ObjectiveProblemPage;
