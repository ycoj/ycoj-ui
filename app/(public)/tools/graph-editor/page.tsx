import GraphEditor from '@/features/tools/graph-editor/graph-editor';
import ThemeLogo from '@/shared/components/theme-logo';
import { Button } from '@/shared/components/ui/button';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('graphEditor');
  return { title: t('name') };
}

export default async function GraphEditorPage() {
  const t = await getTranslations('common');
  const misc = await getTranslations('misc');
  const siteName = process.env.SITE_NAME ?? '';
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <ThemeLogo
          alt={misc('logoAlt', { siteName })}
          width={290}
          height={87}
          className="h-auto w-[100px]"
        />
        <Button asChild variant="outline" size="sm">
          <Link href="/">{t('home')}</Link>
        </Button>
      </header>
      <GraphEditor />
    </div>
  );
}
