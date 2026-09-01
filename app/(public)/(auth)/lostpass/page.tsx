import PasswordResetRequest from '@/features/auth/recovery/password-reset-request';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('passwordReset') };
}

export default function LostPasswordPage() {
  return <PasswordResetRequest />;
}
