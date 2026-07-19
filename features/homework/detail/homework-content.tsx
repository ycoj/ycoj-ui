import HomeworkProblemList from './homework-problem-list';
import type { HomeworkDetailTdoc } from '@/api/server/method/homework/detail';
import Markdown from '@/shared/components/markdown';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import type {
  HomeworkProblemStatusDict,
  HomeworkStatus,
} from '@/shared/types/homework';
import type { ProblemDict } from '@/shared/types/problem';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  introduction: string;
  homework: HomeworkDetailTdoc;
  homeworkStatus?: HomeworkStatus | null;
  pdict?: ProblemDict;
  psdict?: HomeworkProblemStatusDict;
};

export default function HomeworkContent({
  tid,
  introduction,
  homework,
  homeworkStatus,
  pdict,
  psdict,
}: Props) {
  const t = useTranslations('homework');
  return (
    <div data-llm-visible="true">
      <Tabs defaultValue="introduction">
        <TabsList>
          <TabsTrigger value="introduction">{t('introduction')}</TabsTrigger>
          <TabsTrigger value="problems">{t('problems')}</TabsTrigger>
        </TabsList>

        <TabsContent value="introduction" className="pt-2">
          <Markdown>{introduction}</Markdown>
        </TabsContent>

        <TabsContent value="problems" className="pt-2">
          <HomeworkProblemList
            tid={tid}
            homework={homework}
            homeworkStatus={homeworkStatus}
            pdict={pdict}
            psdict={psdict}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
