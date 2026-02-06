import ServerApis from '@/api/server/method';
import RecordFilter from '@/features/record/list/record-filter';
import RecordList from '@/features/record/list/record-list';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '评测记录',
};

export type SearchParams = {
  page?: string;
  pid?: string;
  tid?: string;
  uidOrName?: string;
  lang?: string;
  status?: string;
};

export default async function RecordListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const filterKey = new URLSearchParams(
    Object.entries(searchParams).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (!value) return acc;
        acc[key] = value;
        return acc;
      },
      {}
    )
  ).toString();
  const [data, languages] = await Promise.all([
    ServerApis.Record.getList({
      page: searchParams.page ? parseInt(searchParams.page, 10) : undefined,
      pid: searchParams.pid ? parseInt(searchParams.pid, 10) : undefined,
      tid: searchParams.tid,
      uidOrName: searchParams.uidOrName,
      lang: searchParams.lang,
      status: searchParams.status
        ? parseInt(searchParams.status, 10)
        : undefined,
    }),
    ServerApis.UI.getAvailableLanguages(),
  ]);

  return (
    <div className="space-y-4">
      <RecordFilter key={filterKey} />
      <RecordList data={data} languages={languages.languages} />
      <Pagination page={data.page} infinite />
    </div>
  );
}
