import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';
import ServerApis from '@/api/server/method';
import ProblemConfigWorkspace from '@/features/problem/config/problem-config-workspace';
import ProblemTitle from '@/features/problem/detail/problem-title';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import { Errored } from '@/shared/components/errored';

const loadProblemConfig = cache((pid: string) =>
  ServerApis.Problems.getProblemConfig(pid)
);

type Params = { pid: string };
type SearchParams = { tid?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pid } = await params;
  const data = await loadProblemConfig(pid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('problemConfig') };
  return { title: `${data.pdoc.title} - ${t('problemConfig')}` };
}

export default async function ProblemConfigPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const [data, user] = await Promise.all([loadProblemConfig(pid), getUser()]);
  const t = await getTranslations('problem');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

  const canConfigure =
    searchParams.tid === undefined &&
    Boolean(user._id) &&
    !data.pdoc.reference &&
    ((user._id === data.pdoc.owner &&
      hasPerm(user, PERM.PERM_EDIT_PROBLEM_SELF)) ||
      hasPerm(user, PERM.PERM_EDIT_PROBLEM));
  if (!canConfigure)
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  const languages = await ServerApis.UI.getAvailableLanguages();

  const languageOptions = Object.entries(languages.languages).flatMap(
    ([family, info]) =>
      info.versions.map((version) => ({
        value: version.name,
        label: `${info.display || family} - ${version.display}`,
      }))
  );

  return (
    <div className="space-y-6 [&_[data-slot=button]:not(:disabled)]:cursor-pointer">
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <ProblemConfigWorkspace
        pid={pid}
        docId={data.pdoc.docId}
        title={data.pdoc.title}
        config={data.config}
        testdata={data.testdata}
        languageOptions={languageOptions}
      />
    </div>
  );
}
