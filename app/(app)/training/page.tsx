import ServerApis from '@/api/server/method';
import TrainingFilter from '@/features/training/list/training-filter';
import TrainingList from '@/features/training/list/training-list';
import Pagination from '@/shared/components/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '训练列表',
};

export type SearchParams = {
  q?: string;
  page?: string;
};

function normalizeParam(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function TrainingListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const q = normalizeParam(searchParams.q);
  const page = parsePage(searchParams.page);

  const data = await ServerApis.Training.getTrainingList(page, q);

  const filterKey = new URLSearchParams(
    Object.entries({ q }).reduce<Record<string, string>>(
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
      <TrainingFilter key={filterKey} />
      <TrainingList data={data} />
      <div className="pt-1">
        <Pagination page={data.page} totalPages={data.tpcount} />
      </div>
    </div>
  );
}
