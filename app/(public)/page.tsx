import { getUser } from '@/features/user/lib/get-user';
import SiteFooter from '@/shared/components/site-footer';
import ThemeLogo from '@/shared/components/theme-logo';
import { Button } from '@/shared/components/ui/button';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('home') };
}

export default async function IndexPage() {
  const t = await getTranslations();
  const siteName = process.env.SITE_NAME ?? '';
  const user = await getUser();
  if (user?._id > 0) {
    redirect('/home');
  }

  return (
    <div className="bg-linear-to-b from-background via-background to-muted/30">
      <div
        className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-10 sm:px-6"
        id="landing-container"
      >
        <header className="flex items-center justify-between -ml-4">
          <ThemeLogo
            alt={t('misc.logoAlt', { siteName })}
            width={290}
            height={87}
            sizes="160px"
            className="h-auto w-[140px] sm:w-[160px]"
          />
          <Button asChild className="hidden sm:inline-flex" size="lg">
            <Link href="/login">{t('common.login')}</Link>
          </Button>
        </header>

        <main className="mt-10 flex flex-1 flex-col gap-6 sm:mt-16 sm:gap-8 md:mt-0 md:justify-center">
          <div className="space-y-6 md:space-y-2">
            <h1 className="text-balance text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              {t.rich('landing.title', {
                modern: (chunks) => (
                  <span className="text-emerald-500">{chunks}</span>
                ),
                native: (chunks) => (
                  <span className="text-sky-700">{chunks}</span>
                ),
              })}
            </h1>
            <p className="max-w-prose text-pretty text-base text-muted-foreground sm:text-lg">
              {t.rich('landing.description', {
                siteName,
                highlight: (chunks) => (
                  <span className="font-medium text-foreground">{chunks}</span>
                ),
              })}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 md:hidden">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-sm font-medium text-foreground">
                {t('landing.mobileTitle')}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t('landing.mobileDescription')}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-sm font-medium text-foreground">
                {t('landing.transparentTitle')}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t('landing.transparentDescription')}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-sm font-medium text-foreground">
                {t('landing.aiTitle')}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t('landing.aiDescription')}
              </div>
            </div>
          </div>
        </main>

        <div className="mt-auto pt-10">
          <div className="pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:hidden">
            <Button asChild className="w-full" size="lg">
              <Link href="/login">{t('common.login')}</Link>
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>{t('landing.footerNote')}</p>
            <SiteFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
