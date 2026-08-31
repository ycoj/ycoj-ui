import { getPasteDetail } from '@/features/paste/get-paste';
import PasteDetail from '@/features/paste/paste-detail';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [data, t] = await Promise.all([
    getPasteDetail(id),
    getTranslations('paste'),
  ]);
  return { title: 'error' in data ? t('name') : data.pdoc.title || t('name') };
}

export default async function PasteDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getPasteDetail(id);
  if ('error' in data) return <Errored error={data.error} />;
  return <PasteDetail data={data} />;
}
