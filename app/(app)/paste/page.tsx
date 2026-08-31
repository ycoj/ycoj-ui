import ServerApis from '@/api/server/method';
import PasteForm from '@/features/paste/form/paste-form';
import PasteHistory from '@/features/paste/paste-history';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('paste');
  return { title: t('name') };
}

export default async function PastePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: value } = await searchParams;
  const parsed = typeof value === 'string' ? Number(value) : 1;
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
  const data = await ServerApis.Paste.getPasteMain(page);
  if ('error' in data) return <Errored error={data.error} />;
  const { expiryOptions, languageOptions, defaultExpire, defaultLanguage } =
    data;
  return (
    <TwoColumnLayout
      left={
        <PasteForm
          options={{
            expiryOptions,
            languageOptions,
            defaultExpire,
            defaultLanguage,
          }}
        />
      }
      right={<PasteHistory data={data} />}
    />
  );
}
