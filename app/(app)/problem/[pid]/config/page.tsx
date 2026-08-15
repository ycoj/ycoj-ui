import ServerApis from '@/api/server/method';
import ProblemConfigWorkspace from '@/features/problem/config/problem-config-workspace';
import ProblemTitle from '@/features/problem/detail/problem-title';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';

const loadProblemConfig = cache((pid: string) =>
  ServerApis.Problems.getProblemConfig(pid)
);

type Params = { pid: string };

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
}: {
  params: Promise<Params>;
}) {
  const { pid } = await params;
  const [data, languages] = await Promise.all([
    loadProblemConfig(pid),
    ServerApis.UI.getAvailableLanguages(),
  ]);
  const t = await getTranslations('problem');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

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
