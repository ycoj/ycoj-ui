'use client';

import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/components/ui/pagination';
import { usePathname, useSearchParams } from 'next/navigation';

type Props = {
  pageParam?: string;
  page: number;
  totalPages?: number;
  infinite?: boolean;
};

export default function Pagination({
  pageParam = 'page',
  page,
  totalPages,
  infinite = false,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safePage = Math.max(1, page);
  const safeTotalPages = Math.max(1, totalPages ?? 1);

  if (!infinite && safeTotalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(targetPage));
    return `${pathname}?${params.toString()}`;
  };

  const pagesSet = new Set<number>(
    infinite
      ? [1, 2, safePage - 1, safePage, safePage + 1, safePage + 2]
      : [
          1,
          2,
          safeTotalPages! - 1,
          safeTotalPages!,
          safePage - 1,
          safePage,
          safePage + 1,
          safePage + 2,
        ]
  );

  const pages = Array.from(pagesSet)
    .filter((p) => (infinite ? p >= 1 : p >= 1 && p <= safeTotalPages))
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis'> = [];
  for (const p of pages) {
    const prev = items.at(-1);
    const prevPage = typeof prev === 'number' ? prev : undefined;

    if (prevPage !== undefined && p - prevPage > 1) {
      items.push('ellipsis');
    }
    items.push(p);
  }

  const prevHref = safePage > 1 ? buildHref(safePage - 1) : buildHref(1);
  const nextHref = infinite
    ? buildHref(safePage + 1)
    : safePage < safeTotalPages
      ? buildHref(safePage + 1)
      : buildHref(safeTotalPages);

  return (
    <UiPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={prevHref}
            aria-disabled={safePage <= 1}
            tabIndex={safePage <= 1 ? -1 : undefined}
            className={safePage <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {items.map((item, idx) => {
          if (item === 'ellipsis') {
            return (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={item}>
              <PaginationLink
                href={buildHref(item)}
                isActive={item === safePage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href={nextHref}
            aria-disabled={!infinite && safePage >= safeTotalPages}
            tabIndex={!infinite && safePage >= safeTotalPages ? -1 : undefined}
            className={
              !infinite && safePage >= safeTotalPages
                ? 'pointer-events-none opacity-50'
                : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </UiPagination>
  );
}
