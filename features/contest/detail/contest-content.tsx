import ContestProblemsTab from '@/features/contest/detail/contest-problems-tab';
import Markdown from '@/shared/components/markdown';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { resolveFileUrls } from '@/shared/lib/resolve-file-urls';
import type { FileInfo } from '@/shared/types/file';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  introduction: string;
  files: FileInfo[];
};

export default function ContestContent({ tid, introduction, files }: Props) {
  const t = useTranslations('contest');
  const resolvedIntroduction = resolveFileUrls(introduction, {
    baseUrl: `/api/contest/${tid}/file/public`,
    filenames: files.map(({ name }) => name),
  });
  return (
    <div data-llm-visible="true">
      <Tabs defaultValue="introduction">
        <TabsList>
          <TabsTrigger value="introduction">{t('introduction')}</TabsTrigger>
          <TabsTrigger value="problems">{t('problemList')}</TabsTrigger>
        </TabsList>

        <TabsContent value="introduction" className="pt-2">
          <Markdown>{resolvedIntroduction}</Markdown>
        </TabsContent>

        <TabsContent value="problems" className="pt-2">
          <ContestProblemsTab tid={tid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
