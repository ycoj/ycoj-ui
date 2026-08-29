import MessageRealtimeProvider from '@/features/message/message-realtime-provider';
import { CollapsedTrigger } from '@/features/navigation/collapsed-trigger';
import AppSidebar from '@/features/navigation/sidebar';
import { getNavInfos } from '@/features/user/lib/get-user';
import ThemeLogo from '@/shared/components/theme-logo';
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteName = process.env.SITE_NAME ?? '';
  const t = await getTranslations('misc');
  const nav = await getNavInfos();
  return (
    <MessageRealtimeProvider
      userId={nav.user._id}
      initialUnread={nav.user.unreadMsg}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-auto p-4 md:overflow-visible">
          <CollapsedTrigger />
          <div className="container mx-auto">
            <div className="mb-2 flex md:hidden px-2">
              <Link href="/home" aria-label={siteName}>
                <ThemeLogo
                  width={290}
                  height={87}
                  alt={t('logoAlt', { siteName })}
                  className="h-auto w-30"
                />
              </Link>
            </div>
            <div id="app-body" className="pt-4">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MessageRealtimeProvider>
  );
}
