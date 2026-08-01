import { parseProblemContent } from '../parse-problem-content';
import Markdown from '@/shared/components/markdown';
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
import { ContestDetailProjectionProblem } from '@/shared/types/problem';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

const LANGUAGE_LABELS = {
  zh: '简体中文',
  zh_TW: '繁體中文',
  en: 'English',
  kr: '한국어',
  jp: '日本語',
} as const;

export default function ProblemContent({
  problem,
  tid,
}: {
  problem: ContestDetailProjectionProblem;
  tid?: string;
}) {
  const t = useTranslations('problem');
  const contents = parseProblemContent(problem.content).map((item) => ({
    ...item,
    content: resolveFileUrls(item.content, {
      baseUrl: `/api/p/${problem.docId}/file`,
      filenames: problem.additional_file.map(({ name }) => name),
      query: { tid },
    }),
  }));
  const showFileIoAlert = problem.config?.type === 'fileio';
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
  if (contents.length === 1) {
    const text = contents[0]?.content ?? '';
    return (
      <div className="space-y-4">
        {fileIoAlert}
        <Markdown>{text}</Markdown>
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
              {LANGUAGE_LABELS[language] ?? language}
            </TabsTrigger>
          ))}
        </TabsList>

        {contents.map(({ language, content }) => (
          <TabsContent key={language} value={language}>
            <Markdown>{content}</Markdown>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
