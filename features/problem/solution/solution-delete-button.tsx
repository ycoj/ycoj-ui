'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import type { ObjectId } from '@/shared/types/shared';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  pid: string | number;
  psid: ObjectId;
};

export default function SolutionDeleteButton({ pid, psid }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await ClientApis.Problem.deleteProblemSolution(pid, psid);
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '删除失败，请稍后重试';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          aria-label="删除题解"
          title="删除题解"
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only" data-llm-text="删除题解">
            删除题解
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" data-llm-visible="true">
        <PopoverHeader>
          <PopoverTitle data-llm-text="确认删除这篇题解？">
            确认删除这篇题解？
          </PopoverTitle>
        </PopoverHeader>
        {error && (
          <p className="text-destructive text-xs" data-llm-text={error}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            <span data-llm-text="取消">取消</span>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={handleDelete}
            disabled={submitting}
          >
            <span data-llm-text={submitting ? '删除中...' : '确认删除'}>
              {submitting ? '删除中...' : '确认删除'}
            </span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
