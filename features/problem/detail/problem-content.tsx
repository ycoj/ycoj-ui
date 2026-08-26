import { isFileIoProblem } from '@/features/problem/detail/problem-type';
import {
  makeObjectiveSchema,
  objectiveComponents,
} from '@/features/problem/objective/markdown-config';
import rehypeObjective from '@/features/problem/objective/rehype-objective';
import {
  parseProblemContent,
  PROBLEM_LANGUAGE_LABELS,
} from '@/features/problem/parse-problem-content';
import Markdown, { markdownSanitizeSchema } from '@/shared/components/markdown';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { resolveFileUrls } from '@/shared/lib/resolve-file-urls';
import type { ContestDetailProjectionProblem } from '@/shared/types/problem';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Components } from 'react-markdown';

export default function ProblemContent({
  problem,
  tid,
  objective,
}: {
  problem: ContestDetailProjectionProblem;
  tid?: string;
  objective?: boolean;
}) {
  const t = useTranslations('problem');
  const additionalFilenames =
    problem.additional_file?.map(({ name }) => name) ?? [];
  const contents = parseProblemContent(problem.content).map((item) => ({
    ...item,
    content: resolveFileUrls(item.content, {
      baseUrl: `/api/p/${problem.docId}/file`,
      filenames: additionalFilenames,
      query: { tid },
    }),
  }));
  const showFileIoAlert = isFileIoProblem(problem);
  const subType = problem.config?.subType ?? '';
  const fileInName = `${subType}.in`;
  const fileOutName = `${subType}.out`;
  const fileIoAlert = showFileIoAlert ? (
    <Alert
      data-llm-visible="true"
      className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
    >
      <Info strokeWidth={2} className="text-current" />
      <AlertTitle data-llm-text={t('fileIoTitle')}>
        {t('fileIoTitle')}
      </AlertTitle>
      <AlertDescription>
        {t.rich('fileIoDescription', {
          input: () => (
            <span
              className="mx-1 font-mono text-foreground"
              data-llm-text={fileInName}
            >
              {fileInName}
            </span>
          ),
          output: () => (
            <span
              className="mx-1 font-mono text-foreground"
              data-llm-text={fileOutName}
            >
              {fileOutName}
            </span>
          ),
        })}
      </AlertDescription>
    </Alert>
  ) : null;
  const markdownConfig = {
    rehypePlugins: objective ? [rehypeObjective] : [],
    sanitizeSchema: objective
      ? makeObjectiveSchema(markdownSanitizeSchema)
      : markdownSanitizeSchema,
    components: objective ? objectiveComponents : ({} as Components),
  };
  if (contents.length === 1) {
    const text = contents[0]?.content ?? '';
    return (
      <div className="space-y-4">
        {fileIoAlert}
        <Markdown {...markdownConfig}>{text}</Markdown>
      </div>
    );
  }

  const hasZh = contents.some(({ language }) => language === 'zh');

  return (
    <div className="space-y-4">
      {fileIoAlert}
      <Tabs defaultValue={hasZh ? 'zh' : contents[0].language}>
        <TabsList>
          {contents.map(({ language }) => (
            <TabsTrigger key={language} value={language}>
              {PROBLEM_LANGUAGE_LABELS[language]}
            </TabsTrigger>
          ))}
        </TabsList>

        {contents.map(({ language, content }) => (
          <TabsContent key={language} value={language}>
            <Markdown {...markdownConfig}>{content}</Markdown>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
