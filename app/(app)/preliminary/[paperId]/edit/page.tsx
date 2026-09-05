import ServerApis from '@/api/server/method';
import PreliminaryEditForm from '@/features/preliminary/edit/preliminary-edit-form';
import { mapPreliminaryEditToFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = {
  paperId: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('editPreliminary') };
}

export default async function PreliminaryEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { paperId } = await params;
  const data = await ServerApis.Preliminary.getPreliminaryEdit(paperId);
  const t = await getTranslations('preliminary');

  if ('error' in data) {
    return <Errored title={t('notPublished')} error={data.error} />;
  }

  return (
    <PreliminaryEditForm
      paperId={paperId}
      wasPublished={Boolean(data.paper?.published)}
      defaultValues={mapPreliminaryEditToFormValues(data.definition)}
    />
  );
}
