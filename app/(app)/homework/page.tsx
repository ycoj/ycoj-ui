import ServerApis from '@/api/server/method';
import HomeworkFilter from '@/features/homework/list/homework-filter';
import HomeworkList from '@/features/homework/list/homework-list';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '作业列表',
};

export type SearchParams = {
  q?: string;
  page?: string;
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

export default async function HomeworkListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const q = normalizeParam(searchParams.q);
  const group = normalizeParam(searchParams.group);
  const page = parsePage(searchParams.page);

  const data = await ServerApis.Homework.getHomeworkList(group, page, q);

  const filterKey = new URLSearchParams(
    Object.entries({ q, group }).reduce<Record<string, string>>(
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
      <HomeworkFilter key={filterKey} groups={data.groups} />
      <HomeworkList data={data} />
      <div className="pt-1">
        <Pagination page={data.page} totalPages={data.tpcount} />
      </div>
    </div>
  );
}
