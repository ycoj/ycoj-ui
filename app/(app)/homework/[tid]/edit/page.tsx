import ServerApis from '@/api/server/method';
import { getHomeworkEdit } from '@/features/homework/edit/get-homework-edit';
import HomeworkEditForm from '@/features/homework/edit/homework-edit-form';
import { mapHomeworkEditToFormValues } from '@/features/homework/form/homework-form-utils';
import { canEditHomework } from '@/features/homework/lib/can-edit-homework';
import { resolveProblemListItems } from '@/features/problem/resolve-problem-list-items';
import { getUser } from '@/features/user/lib/get-user';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = { tid: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tid } = await params;
  const data = await getHomeworkEdit(tid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('editHomework') };
  return { title: `${data.tdoc.title} - ${t('editHomework')}` };
}

export default async function HomeworkEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const [data, user, homepage] = await Promise.all([
    getHomeworkEdit(tid),
    getUser(),
    ServerApis.UI.getHomepage(),
  ]);
  const t = await getTranslations('error');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

  if (!canEditHomework(user, data.tdoc))
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  const pids = await resolveProblemListItems(homepage.domain._id, data.pids);

  return (
    <HomeworkEditForm
      tid={tid}
      defaultValues={mapHomeworkEditToFormValues(data, pids)}
      domainId={homepage.domain._id}
    />
  );
}
