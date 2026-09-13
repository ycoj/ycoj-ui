import SolutionStatus from '../solution-status';
import SolutionReviewActions from './solution-review-actions';
import {
  SOLUTION_REVIEW_STATUSES,
  type SolutionReviewData,
} from '@/api/server/method/problems/solution-review';
import UserSpan from '@/features/user/user-span';
import Markdown from '@/shared/components/markdown';
import { Button } from '@/shared/components/ui/button';
import oid2ts from '@/shared/lib/oid2ts';
import { ArrowLeft, ExternalLink, ListChecks, UserRoundX } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = { data: SolutionReviewData };

/** Keys under the `solution` namespace so filters reuse the status badge labels. */
const filterLabelKeys = {
  pending: 'status.1',
  featured: 'status.3',
  approved: 'status.2',
  rejected: 'status.0',
  blocked: 'status.-1',
  all: 'review.all',
} as const;

export default async function SolutionReviewWorkspace({ data }: Props) {
  const t = await getTranslations('solution.review');
  const solutionT = await getTranslations('solution');
  const format = await getFormatter();
  const solution = data.status === 'authors' ? undefined : data.docs[0];
  const authors = data.status === 'authors' ? data.docs : [];
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
  // The backend only offers a direct review for solutions whose author is not
  // blocked yet; a blocked author can only be unblocked.
  const target = solution
    ? solution.reviewStatus === -1
      ? { kind: 'author' as const, uid: solution.owner }
      : {
          kind: 'solution' as const,
          psid: solution.docId,
          revision: solution.revision,
        }
    : null;
  const actionKey = solution
    ? `${solution.docId}:${solution.revision}:${solution.reviewLockUntil}`
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
      {data.status !== 'authors' && (
        <nav aria-label={t('filter')} className="flex flex-wrap gap-1.5">
          {SOLUTION_REVIEW_STATUSES.map((status) => (
            <Button
              key={status}
              asChild
              size="sm"
              variant={data.status === status ? 'secondary' : 'ghost'}
            >
              <Link
                href={`/problem/solution-review?status=${status}`}
                prefetch={false}
                aria-current={data.status === status ? 'page' : undefined}
              >
                {solutionT(filterLabelKeys[status])}
              </Link>
            </Button>
          ))}
        </nav>
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {data.status === 'authors'
                ? t('authorsCount', { count: data.count })
                : t('content')}
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
          {data.status === 'authors' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('unblockConsequences')}
              </p>
              {authors.length > 0 ? (
                <ul className="divide-y rounded-md border">
                  {authors.map((author) => (
                    <li
                      key={author.uid}
                      className="flex flex-wrap items-start justify-between gap-4 p-4"
                    >
                      <div className="min-w-0 space-y-3">
                        <div>{renderUser(author.uid)}</div>
                        {(author.solutionBlockedBy ||
                          author.solutionBlockedAt) && (
                          <dl className="space-y-3 text-sm [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:break-words">
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
                          </dl>
                        )}
                      </div>
                      <SolutionReviewActions
                        key={`author:${author.uid}`}
                        target={{ kind: 'author', uid: author.uid }}
                        showReload={false}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('noAuthors')}
                </p>
              )}
            </div>
          ) : solution ? (
            <Markdown>{solution.content}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          )}
        </section>
        <aside className="min-w-0 space-y-6">
          {data.status === 'authors' ? (
            <SolutionReviewActions target={null} />
          ) : (
            <>
              {solution && (
                <dl className="space-y-3 text-sm [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:break-words">
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
                      <SolutionStatus
                        status={solution.reviewStatus}
                        fallbackLabel={data.reviewLabels[solution.reviewStatus]}
                      />
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
                </dl>
              )}
              <SolutionReviewActions key={actionKey} target={target} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
