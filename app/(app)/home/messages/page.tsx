import ServerApis from '@/api/server/method';
import { getMessages } from '@/features/message/get-messages';
import MessagePage from '@/features/message/message-page';
import { getNavInfos } from '@/features/user/lib/get-user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('messages') };
}

export default async function MessagesRoute() {
  const [initialData, homepage, nav] = await Promise.all([
    getMessages(),
    ServerApis.UI.getHomepage(),
    getNavInfos(),
  ]);
  const avatarUrl =
    typeof nav.user.avatarUrl === 'string' ? nav.user.avatarUrl : undefined;

  return (
    <MessagePage
      currentUser={{ _id: nav.user._id, uname: nav.user.uname, avatarUrl }}
      domainId={homepage.domain._id}
      initialData={initialData}
    />
  );
}
