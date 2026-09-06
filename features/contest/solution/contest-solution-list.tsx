import type { ContestSolutionListItem } from '@/api/server/method/contests/solution';
import UserSpan from '@/features/user/user-span';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import oid2ts from '@/shared/lib/oid2ts';
import type { BaseUserDict } from '@/shared/types/user';
import { Lightbulb } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = {
  tid: string;
  showContestSolutions?: boolean;
  items?: ContestSolutionListItem[];
  udict: BaseUserDict;
  canManage?: boolean;
};

export default async function ContestSolutionList({
  tid,
  showContestSolutions,
  items,
  udict,
  canManage,
}: Props) {
  if (!showContestSolutions) return null;
  const visible = items ?? [];
  if (!visible.length && !canManage) return null;
  const [t, format] = await Promise.all([
    getTranslations('contestSolution'),
    getFormatter(),
  ]);
  return (
    <section
      id="contest-solutions"
      className="space-y-4 border-t pt-8"
      data-llm-visible="true"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t('heading')}</h2>
        {canManage && (
          <Button asChild>
            <Link href={`/contest/${tid}/solution/create`}>{t('create')}</Link>
          </Button>
        )}
      </div>
      {!visible.length ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Lightbulb strokeWidth={2} />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle data-llm-text={t('empty')}>{t('empty')}</EmptyTitle>
            <EmptyDescription data-llm-text={t('emptyDescription')}>
              {t('emptyDescription')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="w-full py-3 pr-3">{t('title')}</th>
                <th className="w-px whitespace-nowrap p-3">{t('author')}</th>
                <th className="w-px whitespace-nowrap p-3">{t('time')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => {
                const date = new Date(oid2ts(doc.docId));
                return (
                  <tr key={doc.docId} className="border-b">
                    <td className="py-3 pr-3">
                      <Link
                        className="text-primary hover:underline"
                        href={`/contest/${tid}/solution/${doc.docId}`}
                      >
                        {doc.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {udict[doc.owner] ? (
                        <UserSpan user={udict[doc.owner]} />
                      ) : (
                        doc.owner
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {format.dateTime(date, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
