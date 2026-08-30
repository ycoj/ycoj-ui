import ServerApis from '@/api/server/method';
import type { LanguageFamily } from '@/api/server/method/ui/languages';
import ContestTimer from '@/features/contest/contest-timer';
import { getContestStatus } from '@/features/contest/detail/contest-utils';
import {
  getProblemDetail,
  type ProblemDetailData,
} from '@/features/problem/detail/get-problem-detail';
import ProblemContent from '@/features/problem/detail/problem-content';
import ProblemTitle from '@/features/problem/detail/problem-title';
import { isObjectiveProblem } from '@/features/problem/detail/problem-type';
import { canEditProblem } from '@/features/problem/lib/can-edit-problem';
import ObjectiveProblemPage from '@/features/problem/objective/objective-page';
import { canEnterScratchpad } from '@/features/problem/scratchpad/scratchpad-eligibility';
import ScratchpadOpenButton from '@/features/problem/scratchpad/scratchpad-open-button';
import ScratchpadProvider from '@/features/problem/scratchpad/scratchpad-provider';
import { flattenScratchpadLanguages } from '@/features/problem/scratchpad/scratchpad-utils';
import ProblemSidebar from '@/features/problem/sidebar';
import { getUser } from '@/features/user/lib/get-user';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { User } from '@/shared/types/user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { unstable_rethrow } from 'next/navigation';

type Params = {
  pid: string;
};

type SearchParams = {
  tid?: string;
};

export async function generateMetadata({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const data = await getProblemDetail(pid, searchParams.tid);
  const t = await getTranslations('metadata');

  if ('error' in data) {
    return {
      title: t('problemDetail'),
    };
  }

  return {
    title: data.pdoc.title || t('problemDetail'),
  };
}

export default async function ProblemDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const [data, user] = await Promise.all([
    getProblemDetail(pid, searchParams.tid),
    getUser(),
  ]);
  const t = await getTranslations('problem');

  if ('error' in data) {
    return <Errored title={t('unavailable')} error={data.error} />;
  }

  const canConfigure = canEditProblem(user, data.pdoc, {
    tid: searchParams.tid,
  });
  const scratchpadEligible = canEnterScratchpad(
    user,
    data.mode,
    isObjectiveProblem(data.pdoc),
    !data.tdoc || getContestStatus(data.tdoc) === 'running'
  );
  let scratchpadLanguages: Record<string, LanguageFamily> = {};
  if (scratchpadEligible) {
    try {
      const response = await ServerApis.UI.getAvailableLanguages(
        data.pdoc.docId
      );
      scratchpadLanguages = response.languages;
    } catch (error) {
      unstable_rethrow(error);
      scratchpadLanguages = {};
    }
  }

  return (
    <ProblemDetailContent
      data={data}
      searchParams={searchParams}
      canConfigure={canConfigure}
      user={user}
      scratchpadLanguages={scratchpadLanguages}
    />
  );
}

function ProblemDetailContent({
  data,
  searchParams,
  canConfigure,
  user,
  scratchpadLanguages,
}: {
  data: ProblemDetailData;
  searchParams: SearchParams;
  canConfigure: boolean;
  user: User | null;
  scratchpadLanguages: Record<string, LanguageFamily>;
}) {
  if (isObjectiveProblem(data.pdoc)) {
    return (
      <ObjectiveProblemPage
        data={data}
        tid={searchParams.tid}
        canConfigure={canConfigure}
        user={user}
      />
    );
  }
  const content = (
    <div className="space-y-6">
      {data.tdoc && <ContestTimer contest={data.tdoc} status={data.tsdoc} />}
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={<ProblemContent problem={data.pdoc} tid={searchParams.tid} />}
        right={
          <ProblemSidebar
            allowSubmit={true}
            discussionCount={data.discussionCount}
            solutionCount={data.solutionCount}
            problem={data.pdoc}
            tid={searchParams.tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
            allowConfigure={canConfigure}
            scratchpadSlot={
              flattenScratchpadLanguages(scratchpadLanguages).length ? (
                <ScratchpadOpenButton />
              ) : undefined
            }
          />
        }
      />
    </div>
  );

  if (!user?._id || !flattenScratchpadLanguages(scratchpadLanguages).length) {
    return content;
  }

  const pid = data.pdoc.pid ?? String(data.pdoc.docId);
  return (
    <ScratchpadProvider
      config={{
        pid,
        problemDocId: data.pdoc.docId,
        domainId: data.pdoc.domainId,
        problemType: data.pdoc.config.type,
        title: data.pdoc.title,
        eventKind: !data.tdoc
          ? 'standalone'
          : data.tdoc.rule === 'homework'
            ? 'homework'
            : 'contest',
        tid: searchParams.tid,
        userId: user._id,
        preferredLanguage: user.codeLang,
        codeTemplate: user.codeTemplate,
        languages: scratchpadLanguages,
      }}
      statement={<ProblemContent problem={data.pdoc} tid={searchParams.tid} />}
    >
      {content}
    </ScratchpadProvider>
  );
}
