import type { CheckinFortune } from '@/shared/types/checkin';

export const CHECKIN_FORTUNES: CheckinFortune[] = [
  'da_xiong',
  'xiong',
  'ping',
  'ji',
  'da_ji',
];

export const CHECKIN_FORTUNE_STYLES: Record<
  CheckinFortune,
  { cell: string; text: string }
> = {
  da_ji: {
    cell: 'bg-emerald-700 dark:bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  ji: {
    cell: 'bg-emerald-400 dark:bg-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  ping: {
    cell: 'bg-amber-300 dark:bg-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
  },
  xiong: {
    cell: 'bg-orange-500 dark:bg-orange-400',
    text: 'text-orange-700 dark:text-orange-300',
  },
  da_xiong: {
    cell: 'bg-red-700 dark:bg-red-500',
    text: 'text-red-700 dark:text-red-400',
  },
};
