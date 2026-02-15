import type { TrainingDetailResponse } from '@/api/server/method/training/detail';
import ProblemDifficulty from '@/features/problem/problem-difficulty';
import ProblemLink from '@/features/problem/problem-link';
import ProblemStatus from '@/features/problem/problem-status';
import { getTrainingChapterAnchorId } from '@/features/training/detail/training-detail-utils';
import Markdown from '@/shared/components/markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { Separator } from '@/shared/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

type Props = {
  data: TrainingDetailResponse;
};

export default function TrainingContent({ data }: Props) {
  const description = data.tdoc.description.trim();
  const sections = data.tdoc.dag ?? [];
  const defaultOpenSections = sections.map((node) => String(node._id));

  return (
    <div className="space-y-4" data-llm-visible="true">
      <section className="-mt-3">
        {/* To align with right bar. */}
        <Markdown>{description}</Markdown>
      </section>

      <Separator />

      <section className="space-y-3">
        <Accordion
          type="multiple"
          defaultValue={defaultOpenSections}
          className="w-full"
        >
          {sections.map((node, index) => {
            const sectionTitle = node.title.trim();
            const chapterLabel = `第 ${index + 1} 章. ${sectionTitle}`;

            return (
              <AccordionItem
                key={node._id}
                value={String(node._id)}
                id={getTrainingChapterAnchorId(node._id)}
                className="border-t first:border-t-0"
              >
                <AccordionTrigger className="cursor-pointer gap-3 px-0 py-3 hover:no-underline">
                  <div className="flex min-w-0 items-center pr-2">
                    <span
                      className="truncate text-base md:text-lg"
                      data-llm-text={chapterLabel}
                    >
                      {chapterLabel}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-1">
                  <Table className="table-fixed">
                    <colgroup>
                      <col className="w-20 md:w-28" />
                      <col className="w-24" />
                      <col />
                      <col className="w-26 md:w-32" />
                    </colgroup>
                    <TableHeader>
                      <TableRow>
                        <TableCell>状态</TableCell>
                        <TableCell>题号</TableCell>
                        <TableCell>题目</TableCell>
                        <TableCell className="text-center">难度</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {node.pids.map((pid) => {
                        const problem = data.pdict[pid];
                        const statusDoc =
                          data.selfPsdict[pid] ?? data.psdict[pid];

                        return (
                          <TableRow key={`${node._id}-${pid}`}>
                            <TableCell>
                              <div className="inline-flex">
                                {statusDoc?.status !== undefined &&
                                statusDoc?.status !== null ? (
                                  <ProblemStatus status={statusDoc} />
                                ) : null}
                              </div>
                            </TableCell>

                            <TableCell
                              className="tabular-nums"
                              data-llm-text={String(
                                problem.pid ?? problem.docId
                              )}
                            >
                              {problem.pid ?? problem.docId}
                            </TableCell>

                            <TableCell>
                              <ProblemLink problem={problem} openInNewTab />
                            </TableCell>

                            <TableCell className="text-center">
                              <div className="inline-flex">
                                <ProblemDifficulty
                                  difficulty={problem.difficulty}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>
    </div>
  );
}
