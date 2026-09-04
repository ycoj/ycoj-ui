import ServerApis from '@/api/server/method';
import type { PreliminaryListView } from '@/api/server/method/preliminary/list';
import PreliminaryAttemptsTable from '@/features/preliminary/list/preliminary-attempts-table';
import PreliminaryFilter from '@/features/preliminary/list/preliminary-filter';
import PreliminaryList from '@/features/preliminary/list/preliminary-list';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, hasPriv, PERM, PRIV } from '@/features/user/lib/priv';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('preliminaryList') };
}

export type SearchParams = {
  q?: string;
  page?: string;
  view?: string;
};

function normalizeParam(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseView(value?: string): PreliminaryListView {
  return value === 'attempts' ? 'attempts' : 'papers';
}

export default async function PreliminaryListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const q = normalizeParam(searchParams.q);
  const page = parsePage(searchParams.page);
  const requestedView = parseView(searchParams.view);

  const user = await getUser();
  const canViewAttempts = hasPriv(user, PRIV.PRIV_USER_PROFILE);
  const view: PreliminaryListView =
    requestedView === 'attempts' && canViewAttempts ? 'attempts' : 'papers';

  const data = await ServerApis.Preliminary.getPreliminaryList(
    page,
    view === 'papers' ? q : undefined,
    view
  );

  const filterKey = `${view}-${q ?? ''}`;

  return (
    <div className="space-y-4">
      <PreliminaryFilter
        key={filterKey}
        view={view}
        canCreate={hasPerm(user, PERM.PERM_CREATE_PROBLEM)}
        showAttemptsTab={canViewAttempts}
      />
      {data.view === 'attempts' ? (
        <PreliminaryAttemptsTable data={data} />
      ) : (
        <PreliminaryList data={data} />
      )}
      <div className="pt-1">
        <Pagination page={data.page} totalPages={data.pcount} />
      </div>
    </div>
  );
}
