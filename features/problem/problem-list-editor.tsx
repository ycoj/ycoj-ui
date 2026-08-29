'use client';

import ClientApis from '@/api/client/method';
import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import { getContestProblemLabel } from '@/features/contest/detail/contest-utils';
import ProblemAutoComplete from '@/features/problem/problem-auto-complete';
import {
  appendUniqueProblems,
  parseProblemIdList,
  problemListLabel,
  reorderItems,
  serializeProblemIds,
} from '@/features/problem/problem-list-editor-utils';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Copy,
  GripVertical,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';

type Props = {
  domainId: string;
  value: ProblemAutoCompleteItem[];
  onValueChange: (value: ProblemAutoCompleteItem[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
};

const ITEM_TYPE = 'problem-list-item';

type DragItem = { index: number };

function ProblemListRow({
  problem,
  index,
  itemCount,
  disabled,
  onMove,
  onRemove,
}: {
  problem: ProblemAutoCompleteItem;
  index: number;
  itemCount: number;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (docId: number) => void;
}) {
  const t = useTranslations('problemListEditor');
  const label = problemListLabel(problem);
  const letter = getContestProblemLabel(index);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { index } satisfies DragItem,
      canDrag: !disabled,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [index, disabled]
  );
  const [, drop] = useDrop<DragItem>(
    () => ({
      accept: ITEM_TYPE,
      hover: (item) => {
        if (item.index === index) return;
        onMove(item.index, index);
        item.index = index;
      },
    }),
    [index, onMove]
  );

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={cn(
        'group hover:bg-muted/50 flex items-center gap-2 py-1.5 text-sm',
        isDragging && 'opacity-50'
      )}
      data-llm-visible="true"
    >
      <GripVertical className="text-muted-foreground size-4 shrink-0 cursor-grab" />
      <span className="w-6 shrink-0 font-semibold" data-llm-text={letter}>
        {letter}
      </span>
      <span className="min-w-0 flex-1 truncate" data-llm-text={label}>
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('moveUp', { label })}
        title={t('moveUp', { label })}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ChevronUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('moveDown', { label })}
        title={t('moveDown', { label })}
        disabled={disabled || index === itemCount - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ChevronDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={t('remove', { label })}
        title={t('remove', { label })}
        disabled={disabled}
        onClick={() => onRemove(problem.docId)}
      >
        <X />
      </Button>
    </div>
  );
}

export default function ProblemListEditor({
  domainId,
  value,
  onValueChange,
  onBlur,
  disabled,
  invalid,
  id,
}: Props) {
  const t = useTranslations('problemListEditor');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const moveItem = useCallback(
    (from: number, to: number) => {
      onValueChange(reorderItems(value, from, to));
    },
    [onValueChange, value]
  );

  const addProblem = (problem: ProblemAutoCompleteItem) => {
    onValueChange(appendUniqueProblems(value, [problem]));
    onBlur?.();
  };

  const removeProblem = (docId: number) => {
    onValueChange(value.filter((item) => item.docId !== docId));
    onBlur?.();
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(serializeProblemIds(value));
      toast.success(t('copySuccess'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const pasteList = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const text = await navigator.clipboard.readText();
      const docIds = parseProblemIdList(text);
      if (!docIds.length) {
        toast.error(t('pasteNone'));
        return;
      }

      const resolved = await Promise.all(
        docIds.map(async (docId) => {
          const { pdocs } = await ClientApis.Problem.searchProblems(
            domainId,
            String(docId)
          ).send();
          return pdocs.find((problem) => problem.docId === docId) ?? null;
        })
      );
      const found = resolved.filter(
        (problem): problem is ProblemAutoCompleteItem => problem !== null
      );
      const missing = docIds.filter((_, index) => resolved[index] === null);
      const next = appendUniqueProblems(value, found);
      const added = next.length - value.length;
      onValueChange(next);
      onBlur?.();

      if (added > 0) toast.success(t('pasteSuccess', { count: added }));
      else if (!missing.length) toast.error(t('pasteNone'));
      if (missing.length) {
        toast.error(t('pasteMissing', { ids: missing.join(', ') }));
      }
    } catch {
      toast.error(t('pasteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-2" data-llm-visible="true">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id} data-llm-text={t('title')}>
            {t('title')}
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              onClick={() => void copyList()}
            >
              <Copy />
              {t('copy')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              onClick={() => void pasteList()}
            >
              <ClipboardPaste />
              {t('paste')}
            </Button>
          </div>
        </div>
        <ProblemAutoComplete
          id={id}
          domainId={domainId}
          value={query}
          onValueChange={setQuery}
          onItemSelect={addProblem}
          onBlur={onBlur}
          placeholder={t('searchPlaceholder')}
          ariaLabel={t('searchPlaceholder')}
          disabled={disabled || busy}
        />
        {value.length === 0 ? (
          <p
            className="text-muted-foreground text-sm"
            data-llm-text={t('empty')}
          >
            {t('empty')}
          </p>
        ) : (
          <div className="divide-border divide-y" aria-invalid={invalid}>
            {value.map((problem, index) => (
              <ProblemListRow
                key={problem.docId}
                problem={problem}
                index={index}
                itemCount={value.length}
                disabled={disabled || busy}
                onMove={moveItem}
                onRemove={removeProblem}
              />
            ))}
          </div>
        )}
      </div>
    </DndProvider>
  );
}
