import { CollapsedTrigger } from '@/features/navigation/collapsed-trigger';
import AppSidebar from '@/features/navigation/sidebar';
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteName = process.env.SITE_NAME ?? '';
  const t = await getTranslations('misc');
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-auto p-4 md:overflow-visible">
        <CollapsedTrigger />
        <div className="container mx-auto">
          <div className="mb-2 flex md:hidden px-2">
            <Link href="/home" aria-label={siteName}>
              <Image
                width={290}
                height={87}
                src="/nav-logo-small_light.png"
                alt={t('logoAlt', { siteName })}
                className="h-auto w-30 dark:invert"
              />
            </Link>
          </div>
          <div id="app-body" className="pt-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
