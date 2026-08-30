import MessageRealtimeProvider from '@/features/message/message-realtime-provider';
import AppFrame from '@/features/navigation/app-frame';
import { getRealnameAccess } from '@/features/realname/lib/realname-access';
import RealnameReminder from '@/features/realname/realname-reminder';
import { getNavInfos } from '@/features/user/lib/get-user';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getNavInfos();
  const access = getRealnameAccess(nav.user);
  if (access.redirectTo) redirect(access.redirectTo);

  return (
    <MessageRealtimeProvider
      userId={nav.user._id}
      initialUnread={nav.user.unreadMsg}
    >
      <AppFrame banner={<RealnameReminder user={nav.user} />}>
        {children}
      </AppFrame>
    </MessageRealtimeProvider>
  );
}
