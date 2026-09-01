import { getPasswordResetPage } from '@/features/auth/recovery/get-password-reset-page';
import PasswordResetForm from '@/features/auth/recovery/password-reset-form';
import SiteFooter from '@/shared/components/site-footer';
import ThemeLogo from '@/shared/components/theme-logo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('passwordReset') };
}

export default async function LostPasswordCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const state = await getPasswordResetPage(code);
  const t = await getTranslations('auth');
  const siteName = process.env.SITE_NAME ?? '';
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <ThemeLogo
          alt={t('logoAlt', { siteName })}
          fetchPriority="high"
          width={290}
          height={87}
          sizes="160px"
          className="h-auto w-[160px]"
        />
        <PasswordResetForm
          code={code}
          username={state.kind === 'data' ? state.username : undefined}
          initialError={state.kind === 'error' ? state.message : undefined}
        />
      </div>
      <div className="fixed inset-x-0 bottom-2">
        <SiteFooter />
      </div>
    </main>
  );
}
