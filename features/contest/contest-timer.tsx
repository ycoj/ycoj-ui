'use client';

import {
  formatContestCountdown,
  getContestTimerState,
} from './contest-timer-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import type { Homework, HomeworkStatus } from '@/shared/types/homework';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Props = {
  contest: Contest | Homework;
  status?: ContestStatus | HomeworkStatus | null;
};

export default function ContestTimer({ contest, status }: Props) {
  const t = useTranslations('contest');
  const [now, setNow] = useState<number | null>(null);
  const [foregroundBounds, setForegroundBounds] = useState<{
    left: number;
    right: number;
    top: number;
  } | null>(null);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const foreground = document.querySelector<HTMLElement>(
      '[data-slot="sidebar-inset"]'
    );
    if (!foreground) return;

    const updateBounds = () => {
      const bounds = foreground.getBoundingClientRect();
      const radius = Number.parseFloat(
        window.getComputedStyle(foreground).borderTopLeftRadius
      );
      const inset = Number.isFinite(radius) ? radius : 0;
      setForegroundBounds({
        left: bounds.left + inset,
        right: window.innerWidth - bounds.right + inset,
        top: bounds.top,
      });
    };

    updateBounds();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateBounds);
    observer?.observe(foreground);
    window.addEventListener('resize', updateBounds);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  const state =
    now === null ? null : getContestTimerState(contest, status, now);
  if (!state) return null;

  const countdown = formatContestCountdown(state.remainingSeconds);
  const progressPercent = state.progress * 100;
  const label = `${t('timeRemaining')}: ${countdown}`;

  return (
    <TooltipProvider>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50"
        data-llm-visible="true"
        style={
          foregroundBounds
            ? {
                left: foregroundBounds.left,
                right: foregroundBounds.right,
                top: foregroundBounds.top,
              }
            : undefined
        }
      >
        <div
          aria-label={t('contestProgress')}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(progressPercent)}
          className="bg-muted/70 h-0.5 w-full"
          role="progressbar"
        >
          <div
            className="bg-primary h-full transition-[width] duration-700 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              aria-label={label}
              className="bg-background/95 text-foreground pointer-events-auto absolute top-2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm"
              data-llm-text={label}
              style={{ left: `${progressPercent}%` }}
              tabIndex={0}
            >
              <Clock aria-hidden="true" className="size-3.5 text-primary" />
              <span className="tabular-nums">{countdown}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{t('timeRemaining')}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
