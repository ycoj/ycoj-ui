import type { RankingUser } from '@/api/server/method/ranking/list';
import UserSpan from '@/features/user/user-span';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { RpInfo } from '@/shared/types/user';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** RP category key -> display label (Problems, Contests, etc.) */
const RP_CATEGORIES: Array<keyof RpInfo> = ['problem', 'contest'];

type Props = {
  udocs: RankingUser[];
  page: number;
  pageSize: number;
};

function formatRp(value: number | undefined): string {
  if (value === undefined) return '-';
  return String(Math.round(value));
}

export default function RankingLeaderboard({ udocs, page, pageSize }: Props) {
  const t = useTranslations('ranking');
  const common = useTranslations('common');
  if (!udocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <Users strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('noUsers')}>{t('noUsers')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table className="table-fixed" data-llm-visible="true">
      <colgroup>
        <col className="w-14" />
        <col className="w-32 md:w-40" />
        <col className="w-16" />
        {RP_CATEGORIES.map((key) => (
          <col key={key} className="w-16 hidden lg:table-column" />
        ))}
        <col />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableCell className="font-medium">#</TableCell>
          <TableCell className="font-medium">{common('user')}</TableCell>
          <TableCell className="font-medium text-center">RP</TableCell>
          {RP_CATEGORIES.map((key) => (
            <TableCell
              key={key}
              className="hidden text-center font-medium lg:table-cell"
            >
              {t(`category.${key}`)}
            </TableCell>
          ))}
          <TableCell className="font-medium">{t('bio')}</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {udocs.map((user, index) => {
          const rank = (page - 1) * pageSize + index + 1;
          return (
            <TableRow key={user._id}>
              <TableCell data-llm-text={String(rank)}>{rank}</TableCell>
              <TableCell>
                <UserSpan user={user} />
              </TableCell>
              <TableCell
                className="text-center"
                data-llm-text={String(user.rp)}
              >
                {formatRp(user.rp)}
              </TableCell>
              {RP_CATEGORIES.map((key) => (
                <TableCell
                  key={key}
                  className="hidden text-center lg:table-cell"
                  data-llm-text={formatRp(user.rpInfo?.[key])}
                >
                  {formatRp(user.rpInfo?.[key])}
                </TableCell>
              ))}
              <TableCell className="max-w-48 truncate text-muted-foreground text-sm">
                {user.bio ?? ''}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
