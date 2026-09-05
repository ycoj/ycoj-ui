import type { ContestDetailResponse } from '@/api/server/method/contests/detail';
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
import { Lightbulb } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = { tid: string; data: ContestDetailResponse };

export default async function ContestSolutionList({ tid, data }: Props) {
  if (data.tdoc.rule === 'homework' || !data.showContestSolutions) return null;
  if (!data.csdocs?.length && !data.canManage) return null;
  const t = await getTranslations('contestSolution');
  const format = await getFormatter();
  return (
    <section
      id="contest-solutions"
      className="space-y-4 border-t pt-8"
      data-llm-visible="true"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t('heading')}</h2>
        {data.canManage && (
          <Button asChild>
            <Link href={`/contest/${tid}/solution/create`}>{t('create')}</Link>
          </Button>
        )}
      </div>
      {!data.csdocs?.length ? (
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
              {data.csdocs.map((doc) => (
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
                    {data.udict[doc.owner] ? (
                      <UserSpan user={data.udict[doc.owner]} />
                    ) : (
                      doc.owner
                    )}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {format.dateTime(new Date(oid2ts(doc.docId)), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
