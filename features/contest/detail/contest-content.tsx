import ContestProblemsTab from '@/features/contest/detail/contest-problems-tab';
import Markdown from '@/shared/components/markdown';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  introduction: string;
};

export default function ContestContent({ tid, introduction }: Props) {
  const t = useTranslations('contest');
  return (
    <div data-llm-visible="true">
      <Tabs defaultValue="introduction">
        <TabsList>
          <TabsTrigger value="introduction">{t('introduction')}</TabsTrigger>
          <TabsTrigger value="problems">{t('problemList')}</TabsTrigger>
        </TabsList>

        <TabsContent value="introduction" className="pt-2">
          <Markdown>{introduction}</Markdown>
        </TabsContent>

        <TabsContent value="problems" className="pt-2">
          <ContestProblemsTab tid={tid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
