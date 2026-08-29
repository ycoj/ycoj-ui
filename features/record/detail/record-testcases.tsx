import { formatTestcaseMessage } from '@/features/record/detail/format-testcase-message';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  STATUS_BACKGROUND_COLOR,
  STATUS_SHORT_TEXTS,
} from '@/shared/configs/status';
import { formatMemory } from '@/shared/lib/format-units';
import type { RecordDoc, TestCaseResponse } from '@/shared/types/record';
import { useTranslations } from 'next-intl';

type Props = {
  rdoc: RecordDoc;
};

function RecordTestcaseList({
  testcases,
  className,
}: {
  testcases: TestCaseResponse[];
  className?: string;
}) {
  return (
    <TooltipProvider>
      <div className={className}>
        {testcases.map((testcase) => {
          const message = formatTestcaseMessage(testcase.message);
          const content = (
            <div
              key={`testcase-${testcase.id}`}
              className="h-28 w-28 rounded-md border dark:brightness-150"
              style={{
                borderColor: STATUS_BACKGROUND_COLOR[testcase.status],
              }}
            >
              <span
                className="pl-1 pt-0.5 text-xs absolute"
                style={{ color: STATUS_BACKGROUND_COLOR[testcase.status] }}
              >
                #{testcase.id}
              </span>
              <div className="h-full text-center flex justify-center items-center flex-col">
                <div
                  className="text-xl font-bold"
                  style={{ color: STATUS_BACKGROUND_COLOR[testcase.status] }}
                >
                  {STATUS_SHORT_TEXTS[testcase.status]}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <div>
                    {Math.round(testcase.time)}ms<span className="mx-1">/</span>
                    {formatMemory(testcase.memory * 1024)}
                  </div>
                </div>
              </div>
            </div>
          );

          if (!message.trim()) {
            return content;
          }

          return (
            <Tooltip key={`testcase-${testcase.id}-tooltip`}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent className="whitespace-pre-wrap">
                {message}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function getSubtaskTestcases(rdoc: RecordDoc, subtaskId: number) {
  return rdoc.testCases
    .filter((tc) => tc.subtaskId === subtaskId)
    .sort((a, b) => a.id - b.id);
}

function RecordSubtask({
  rdoc,
  subtaskId,
}: {
  rdoc: RecordDoc;
  subtaskId: number;
}) {
  const t = useTranslations('record');
  const testcases = getSubtaskTestcases(rdoc, subtaskId);

  return (
    <>
      <AccordionTrigger className="cursor-pointer gap-3 px-3 py-2">
        <div className="flex w-full flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {t('subtask', { id: subtaskId })}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="h-auto">
        <RecordTestcaseList
          testcases={testcases}
          className="flex flex-wrap h-max gap-4 mt-2 px-2"
        />
      </AccordionContent>
    </>
  );
}

export function RecordTestcases({ rdoc }: Props) {
  const t = useTranslations('record');
  if (!rdoc.testCases?.length) {
    return null;
  }

  const subtasks = [...new Set(rdoc.testCases.map((tc) => tc.subtaskId))];
  const defaultValues = subtasks.map((subtaskId) => `subtask-${subtaskId}`);
  const isSingleSubtask = subtasks.length === 1;
  const singleSubtaskId = subtasks[0];

  return (
    <Card>
      {isSingleSubtask && (
        <CardHeader>
          <CardTitle>{t('testcaseDetails')}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {isSingleSubtask ? (
          <div>
            <RecordTestcaseList
              testcases={getSubtaskTestcases(rdoc, singleSubtaskId)}
              className="flex flex-wrap h-max gap-4"
            />
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={defaultValues}>
            {subtasks.map((subtaskId) => (
              <AccordionItem
                key={`subtask-${subtaskId}`}
                value={`subtask-${subtaskId}`}
              >
                <RecordSubtask rdoc={rdoc} subtaskId={subtaskId} />
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
