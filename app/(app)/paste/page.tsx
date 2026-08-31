import ServerApis from '@/api/server/method';
import PasteCreateForm from '@/features/paste/create/paste-create-form';
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
  const requested = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
  const data = await ServerApis.Paste.getPasteMain(requested);
  if ('error' in data) return <Errored error={data.error} />;
  const {
    languageOptions,
    defaultExpire,
    defaultLanguage,
    pdocs,
    page,
    ppcount,
  } = data;
  return (
    <TwoColumnLayout
      left={
        <PasteCreateForm
          options={{ languageOptions, defaultExpire, defaultLanguage }}
        />
      }
      right={
        <PasteHistory
          pdocs={pdocs}
          page={page}
          ppcount={ppcount}
          languageOptions={languageOptions}
        />
      }
    />
  );
}
