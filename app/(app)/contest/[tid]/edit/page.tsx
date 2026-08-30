import ServerApis from '@/api/server/method';
import ContestEditForm from '@/features/contest/edit/contest-edit-form';
import { getContestEdit } from '@/features/contest/edit/get-contest-edit';
import {
  mapContestEditToFormValues,
  resolveContestAutoHide,
} from '@/features/contest/form/contest-form-utils';
import { canEditContest } from '@/features/contest/lib/can-edit-contest';
import { resolveProblemListItems } from '@/features/problem/resolve-problem-list-items';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
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
  const data = await getContestEdit(tid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('editContest') };
  return { title: `${data.tdoc.title} - ${t('editContest')}` };
}

export default async function ContestEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tid } = await params;
  const [data, user, homepage] = await Promise.all([
    getContestEdit(tid),
    getUser(),
    ServerApis.UI.getHomepage(),
  ]);
  const t = await getTranslations('error');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

  if (!canEditContest(user, data.tdoc))
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  const pids = await resolveProblemListItems(homepage.domain._id, data.pids);
  const canAutoHide = hasPerm(user, PERM.PERM_EDIT_PROBLEM);
  const mapped = mapContestEditToFormValues(data, pids, user.timeZone);

  return (
    <ContestEditForm
      tid={tid}
      defaultValues={{
        ...mapped,
        autoHide: resolveContestAutoHide(canAutoHide, mapped.autoHide),
      }}
      canAutoHide={canAutoHide}
      domainId={homepage.domain._id}
    />
  );
}
