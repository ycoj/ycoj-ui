import ServerApis from '@/api/server/method';
import ContestFilter from '@/features/contest/list/contest-filter';
import ContestList from '@/features/contest/list/contest-list';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('contestList') };
}

export type SearchParams = {
  q?: string;
  page?: string;
  rule?: string;
  group?: string;
};

function normalizeParam(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function ContestListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const q = normalizeParam(searchParams.q);
  const rule = normalizeParam(searchParams.rule);
  const group = normalizeParam(searchParams.group);
  const page = parsePage(searchParams.page);

  const [data, user] = await Promise.all([
    ServerApis.Contests.getContestList(rule, group, page, q),
    getUser(),
  ]);

  const filterKey = new URLSearchParams(
    Object.entries({ q, rule, group }).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (!value) return acc;
        acc[key] = value;
        return acc;
      },
      {}
    )
  ).toString();

  return (
    <div className="space-y-4">
      <ContestFilter
        key={filterKey}
        groups={data.groups}
        canCreate={hasPerm(user, PERM.PERM_CREATE_CONTEST)}
      />
      <ContestList data={data} />
      <div className="pt-1">
        <Pagination page={data.page} totalPages={data.tpcount} />
      </div>
    </div>
  );
}
