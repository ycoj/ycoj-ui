import ContestProblemsTab from '@/features/contest/detail/contest-problems-tab';
import Markdown from '@/shared/components/markdown';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';

type Props = {
  tid: string;
  introduction: string;
};

export default function ContestContent({ tid, introduction }: Props) {
  return (
    <div data-llm-visible="true">
      <Tabs defaultValue="introduction">
        <TabsList>
          <TabsTrigger value="introduction">比赛介绍</TabsTrigger>
          <TabsTrigger value="problems">题目列表</TabsTrigger>
        </TabsList>

        <TabsContent value="introduction" className="pt-2">
          {introduction.trim() ? (
            <Markdown>{introduction}</Markdown>
          ) : (
            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
              <span data-llm-text="暂无比赛介绍">暂无比赛介绍</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="problems" className="pt-2">
          <ContestProblemsTab tid={tid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
