import GraphEditor from '@/features/tools/graph-editor/graph-editor';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('graphEditor');
  return { title: t('name') };
}

export default function GraphEditorPage() {
  return <GraphEditor />;
}
