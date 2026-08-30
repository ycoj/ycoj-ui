import { CollapsedTrigger } from '@/features/navigation/collapsed-trigger';
import AppSidebar from '@/features/navigation/sidebar';
import ThemeLogo from '@/shared/components/theme-logo';
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = {
  children: React.ReactNode;
  banner?: React.ReactNode;
};

export default async function AppFrame({ children, banner }: Props) {
  const siteName = process.env.SITE_NAME ?? '';
  const t = await getTranslations('misc');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-auto p-4 md:overflow-visible">
        <CollapsedTrigger />
        <div className="container mx-auto">
          <div className="mb-2 flex px-2 md:hidden">
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
            {banner}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
