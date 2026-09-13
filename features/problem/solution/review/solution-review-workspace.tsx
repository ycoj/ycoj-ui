import SolutionStatus from '../solution-status';
import SolutionReviewActions from './solution-review-actions';
import type { SolutionReviewData } from '@/api/server/method/problems/solution-review';
import UserSpan from '@/features/user/user-span';
import Markdown from '@/shared/components/markdown';
import { Button } from '@/shared/components/ui/button';
import oid2ts from '@/shared/lib/oid2ts';
import { ArrowLeft, ExternalLink, ListChecks, UserRoundX } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = { data: SolutionReviewData };

export default async function SolutionReviewWorkspace({ data }: Props) {
  const t = await getTranslations('solution.review');
  const format = await getFormatter();
  const solution = data.status === 'pending' ? data.docs[0] : undefined;
  const author = data.status === 'authors' ? data.docs[0] : undefined;
  const problem = solution ? data.pdict[solution.parentId] : undefined;
  const renderUser = (uid: number) =>
    data.udict[uid] ? (
      <UserSpan user={data.udict[uid]} showAvatar />
    ) : (
      <span>UID {uid}</span>
    );
  const renderDate = (value: string | number) =>
    format.dateTime(new Date(value), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  const target = solution
    ? {
        kind: 'solution' as const,
        psid: solution.docId,
        revision: solution.revision,
      }
    : author
      ? { kind: 'author' as const, uid: author.uid }
      : null;
  const actionKey = solution
    ? `${solution.docId}:${solution.revision}:${solution.reviewLockUntil}`
    : author
      ? `author:${author.uid}`
      : data.status;

  return (
    <div className="min-w-0 space-y-6" data-llm-visible="true">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={t('back')}
            title={t('back')}
          >
            <Link href="/problem">
              <ArrowLeft />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href={
                data.status === 'authors'
                  ? '/problem/solution-review'
                  : '/problem/solution-review?status=authors'
              }
              prefetch={false}
            >
              {data.status === 'authors' ? <ListChecks /> : <UserRoundX />}
              {data.status === 'authors' ? t('queue') : t('authors')}
            </Link>
          </Button>
        </div>
      </header>
      <dl className="grid grid-cols-1 gap-4 border-y py-4 sm:grid-cols-3">
        {(['totalSolutions', 'newToday', 'pendingReview'] as const).map(
          (key) => (
            <div key={key}>
              <dt className="text-sm text-muted-foreground">{t(key)}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {format.number(data.stats[key])}
              </dd>
            </div>
          )
        )}
      </dl>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {data.status === 'authors' ? t('authors') : t('content')}
            </h2>
            {solution && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={t('view')}
                title={t('view')}
              >
                <Link
                  href={`/problem/${problem?.pid ?? solution.parentId}/solution?sid=${solution.docId}`}
                  prefetch={false}
                >
                  <ExternalLink />
                </Link>
              </Button>
            )}
          </div>
          {solution ? (
            <Markdown>{solution.content}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">
              {author
                ? t('unblockConsequences')
                : data.status === 'authors'
                  ? t('noAuthors')
                  : t('empty')}
            </p>
          )}
        </section>
        <aside className="min-w-0 space-y-6">
          {(solution || author) && (
            <dl className="space-y-3 text-sm [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:break-words">
              {solution && (
                <>
                  <div>
                    <dt>{t('problem')}</dt>
                    <dd>
                      <Link
                        className="hover:underline"
                        href={`/problem/${problem?.pid ?? solution.parentId}`}
                      >
                        {problem?.title ?? solution.parentId}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('author')}</dt>
                    <dd>{renderUser(solution.owner)}</dd>
                  </div>
                  <div>
                    <dt>{t('status')}</dt>
                    <dd>
                      <SolutionStatus status={solution.reviewStatus} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t('votes')}</dt>
                    <dd>{format.number(solution.vote)}</dd>
                  </div>
                  <div>
                    <dt>{t('submitted')}</dt>
                    <dd>{renderDate(oid2ts(solution._id))}</dd>
                  </div>
                  {solution.reviewedBy && (
                    <div>
                      <dt>{t('reviewedBy')}</dt>
                      <dd>{renderUser(solution.reviewedBy)}</dd>
                    </div>
                  )}
                  {solution.reviewedAt && (
                    <div>
                      <dt>{t('reviewedAt')}</dt>
                      <dd>{renderDate(solution.reviewedAt)}</dd>
                    </div>
                  )}
                </>
              )}
              {author && (
                <>
                  <div>
                    <dt>{t('author')}</dt>
                    <dd>{renderUser(author.uid)}</dd>
                  </div>
                  {author.solutionBlockedBy && (
                    <div>
                      <dt>{t('blockedBy')}</dt>
                      <dd>{renderUser(author.solutionBlockedBy)}</dd>
                    </div>
                  )}
                  {author.solutionBlockedAt && (
                    <div>
                      <dt>{t('blockedAt')}</dt>
                      <dd>{renderDate(author.solutionBlockedAt)}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          )}
          <SolutionReviewActions key={actionKey} target={target} />
        </aside>
      </div>
    </div>
  );
}
