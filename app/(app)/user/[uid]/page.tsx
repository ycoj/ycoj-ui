import { getUserDetail } from '@/features/user/profile/get-user-detail';
import UserProfilePage from '@/features/user/profile/user-profile-page';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = {
  uid: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const data = await getUserDetail(Number(uid));
  const t = await getTranslations('metadata');
  return {
    title: `${data.udoc.uname} - ${t('userProfile')}`,
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { uid } = await params;
  const data = await getUserDetail(Number(uid));

  return <UserProfilePage data={data} />;
}
