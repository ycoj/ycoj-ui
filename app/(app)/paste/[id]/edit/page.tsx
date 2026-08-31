import PasteForm from '@/features/paste/form/paste-form';
import { getPasteEdit } from '@/features/paste/get-paste';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [data, t] = await Promise.all([
    getPasteEdit(id),
    getTranslations('paste'),
  ]);
  return {
    title:
      'error' in data || !data.pdoc.title
        ? t('edit')
        : `${data.pdoc.title} - ${t('edit')}`,
  };
}

export default async function PasteEditPage({ params }: Props) {
  const { id } = await params;
  const data = await getPasteEdit(id);
  if ('error' in data) return <Errored error={data.error} />;
  return <PasteForm key={data.pdoc._id} options={data} paste={data.pdoc} />;
}
