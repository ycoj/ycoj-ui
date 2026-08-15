'use client';

import { ConfigField } from './config-controls';
import { useProblemConfig } from './problem-config-context';
import {
  detectTestcasePairs,
  normalizeSubtaskScores,
  parseMemoryMb,
  parseTimeMs,
  testcaseKey,
} from './problem-config-utils';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type {
  ProblemSubtask,
  ProblemTestCase,
} from '@/shared/types/problem-config';
import {
  ChevronDown,
  ChevronRight,
  FileInput,
  FileOutput,
  GripVertical,
  MoveRight,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ContextMenu, Dialog } from 'radix-ui';
import {
  type PointerEvent as ReactPointerEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

type SourceId = number | null;
type DragItem = { source: SourceId; keys: string[] };

function DialogFrame({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border bg-background p-5 shadow-lg"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="pr-10 text-lg font-semibold"
            data-llm-text={title}
          >
            {title}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4"
              aria-label={title}
            >
              <X />
            </Button>
          </Dialog.Close>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GlobalSettingsDialog() {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(() => parseTimeMs(state.config.time));
  const [memory, setMemory] = useState(() =>
    parseMemoryMb(state.config.memory)
  );
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Settings />
        {t('globalLimits')}
      </Button>
      <DialogFrame open={open} onOpenChange={setOpen} title={t('globalLimits')}>
        <div className="space-y-4">
          <ConfigField label={t('timeLimit')}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={time}
                onChange={(event) =>
                  setTime(Math.max(1, Number(event.target.value) || 1))
                }
              />
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
          </ConfigField>
          <ConfigField label={t('memoryLimit')}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={memory}
                onChange={(event) =>
                  setMemory(Math.max(1, Number(event.target.value) || 1))
                }
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
          </ConfigField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                dispatch({
                  type: 'configChanged',
                  config: {
                    ...state.config,
                    time: `${time}ms`,
                    memory: `${memory}MB`,
                  },
                });
                setOpen(false);
              }}
            >
              {t('apply')}
            </Button>
          </div>
        </div>
      </DialogFrame>
    </>
  );
}

function ManualPairDialog() {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const filenames = state.testdata
    .map((file) => file.name)
    .filter((name) => name.toLowerCase() !== 'config.yaml');

  const chooseInput = (name: string) => {
    setInput(name);
    const base = name.slice(0, name.lastIndexOf('.'));
    const match = [`${base}.out`, `${base}.ans`].find((candidate) =>
      filenames.includes(candidate)
    );
    if (match) setOutput(match);
  };
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        {t('addTestcase')}
      </Button>
      <DialogFrame open={open} onOpenChange={setOpen} title={t('addTestcase')}>
        <div className="space-y-4">
          <ConfigField label={t('inputFile')}>
            <Select value={input} onValueChange={chooseInput}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectInput')} />
              </SelectTrigger>
              <SelectContent>
                {filenames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ConfigField>
          <ConfigField label={t('outputFile')}>
            <Select value={output} onValueChange={setOutput}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectOutput')} />
              </SelectTrigger>
              <SelectContent>
                {filenames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ConfigField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              disabled={!input || !output}
              onClick={() => {
                dispatch({
                  type: 'addUnassigned',
                  cases: [{ input, output }],
                });
                setInput('');
                setOutput('');
                setOpen(false);
              }}
            >
              {t('add')}
            </Button>
          </div>
        </div>
      </DialogFrame>
    </>
  );
}

function SubtaskSettingsDialog({ subtask }: { subtask: ProblemSubtask }) {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(
    subtask.time ? String(parseTimeMs(subtask.time)) : ''
  );
  const [memory, setMemory] = useState(
    subtask.memory ? String(parseMemoryMb(subtask.memory)) : ''
  );
  const [score, setScore] = useState(String(subtask.score ?? 0));
  const [method, setMethod] = useState(subtask.type ?? 'min');
  const [dependencies, setDependencies] = useState(subtask.if ?? []);
  const available = (state.config.subtasks ?? []).filter(
    (item) => item.id !== subtask.id
  );

  const apply = () => {
    const nextSubtasks = (state.config.subtasks ?? []).map((item) =>
      item.id === subtask.id
        ? {
            ...item,
            time: time ? `${Math.max(1, Number(time))}ms` : undefined,
            memory: memory ? `${Math.max(1, Number(memory))}MB` : undefined,
            score: Math.min(100, Math.max(1, Number(score) || 1)),
            type: method,
            if: dependencies.length ? dependencies : undefined,
          }
        : item
    );
    dispatch({
      type: 'configChanged',
      config: {
        ...state.config,
        subtasks: normalizeSubtaskScores(nextSubtasks),
      },
    });
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        title={t('subtaskSettings')}
        aria-label={t('subtaskSettings')}
        onClick={() => setOpen(true)}
      >
        <Settings />
      </Button>
      <DialogFrame
        open={open}
        onOpenChange={setOpen}
        title={t('subtaskSettingsTitle', { id: subtask.id ?? 0 })}
      >
        <div className="space-y-4">
          <ConfigField label={t('timeLimit')}>
            <Input
              type="number"
              min={1}
              value={time}
              placeholder={String(parseTimeMs(state.config.time))}
              onChange={(event) => setTime(event.target.value)}
            />
          </ConfigField>
          <ConfigField label={t('memoryLimit')}>
            <Input
              type="number"
              min={1}
              value={memory}
              placeholder={String(parseMemoryMb(state.config.memory))}
              onChange={(event) => setMemory(event.target.value)}
            />
          </ConfigField>
          <ConfigField label={t('score')}>
            <Input
              type="number"
              min={1}
              max={100}
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </ConfigField>
          <ConfigField label={t('scoringMethod')}>
            <Select
              value={method}
              onValueChange={(value) =>
                setMethod(value as 'min' | 'max' | 'sum')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['min', 'max', 'sum'] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`scoring.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ConfigField>
          <ConfigField label={t('dependencies')}>
            <div className="space-y-2 rounded-lg border p-3">
              {available.length ? (
                available.map((item) => {
                  const id = item.id ?? 0;
                  const checked = dependencies.includes(id);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox
                        id={`dependency-${subtask.id}-${id}`}
                        checked={checked}
                        onCheckedChange={(value) =>
                          setDependencies((current) =>
                            value === true
                              ? [...current, id]
                              : current.filter(
                                  (dependency) => dependency !== id
                                )
                          )
                        }
                      />
                      <Label htmlFor={`dependency-${subtask.id}-${id}`}>
                        {t('subtask', { id })}
                      </Label>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">{t('none')}</p>
              )}
            </div>
          </ConfigField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="button" onClick={apply}>
              {t('apply')}
            </Button>
          </div>
        </div>
      </DialogFrame>
    </>
  );
}

function intersects(a: DOMRect, b: DOMRect) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function CaseRow({
  testcase,
  source,
  selected,
  selectedKeys,
  targets,
  onSelect,
  register,
}: {
  testcase: ProblemTestCase;
  source: SourceId;
  selected: boolean;
  selectedKeys: string[];
  targets: SourceId[];
  onSelect: (additive: boolean) => void;
  register: (key: string, element: HTMLDivElement | null) => void;
}) {
  const t = useTranslations('problem.config');
  const { dispatch } = useProblemConfig();
  const key = testcaseKey(testcase);
  const dragKeys = selected ? selectedKeys : [key];
  const [{ dragging }, drag] = useDrag(
    () => ({
      type: 'problem-config-cases',
      item: { source, keys: dragKeys } satisfies DragItem,
      collect: (monitor) => ({ dragging: monitor.isDragging() }),
    }),
    [source, dragKeys.join('|')]
  );
  const move = (target: SourceId) =>
    dispatch({ type: 'moveCases', source, target, keys: dragKeys });
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={(element) => {
            register(key, element);
            drag(element);
          }}
          role="option"
          aria-selected={selected}
          data-selected={selected}
          className="group grid min-h-10 cursor-grab grid-cols-[1.25rem_minmax(0,1fr)_2rem] items-center gap-2 rounded-md px-2 py-1 text-sm select-none data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
          style={{ opacity: dragging ? 0.45 : 1 }}
          onClick={(event) => onSelect(event.ctrlKey || event.metaKey)}
        >
          <GripVertical className="size-4 text-muted-foreground" />
          <div className="min-w-0 font-mono text-xs">
            <div className="flex min-w-0 items-center gap-1">
              <FileInput className="size-3 shrink-0" />
              <span
                className="truncate"
                title={testcase.input}
                data-llm-text={testcase.input}
              >
                {testcase.input}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
              <FileOutput className="size-3 shrink-0" />
              <span
                className="truncate"
                title={testcase.output}
                data-llm-text={testcase.output}
              >
                {testcase.output || t('none')}
              </span>
            </div>
          </div>
          {targets.length ? (
            <Select
              onValueChange={(value) =>
                move(value === 'unassigned' ? null : Number(value))
              }
            >
              <SelectTrigger
                className="size-7 border-0 p-1 [&>svg:last-child]:hidden"
                aria-label={t('moveCase')}
                title={t('moveCase')}
              >
                <MoveRight className="size-4" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem
                    key={target ?? 'unassigned'}
                    value={target === null ? 'unassigned' : String(target)}
                  >
                    {target === null
                      ? t('unassigned')
                      : t('subtask', { id: target })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          {targets.length ? (
            targets.map((target) => (
              <ContextMenu.Item
                key={target ?? 'unassigned'}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent"
                onSelect={() => move(target)}
              >
                <MoveRight className="size-4" />
                {target === null
                  ? t('moveToUnassigned')
                  : t('moveToSubtask', { id: target })}
              </ContextMenu.Item>
            ))
          ) : (
            <ContextMenu.Item
              disabled
              className="px-2 py-1.5 text-sm text-muted-foreground"
            >
              {t('noMoveTarget')}
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function CaseColumn({
  source,
  title,
  cases,
  targets,
  removable = false,
}: {
  source: SourceId;
  title: string;
  cases: ProblemTestCase[];
  targets: SourceId[];
  removable?: boolean;
}) {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const keyName = source === null ? 'unassigned' : String(source);
  const selectedKeys = state.selection[keyName] ?? [];
  const selected = new Set(selectedKeys);
  const elements = useRef(new Map<string, HTMLDivElement>());
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, drop] = useDrop<DragItem>(
    () => ({
      accept: 'problem-config-cases',
      canDrop: (item) => item.source !== source,
      drop: (item) =>
        dispatch({
          type: 'moveCases',
          source: item.source,
          target: source,
          keys: item.keys,
        }),
    }),
    [source]
  );

  const finishMarquee = () => {
    if (!marquee) return;
    const selectionRect = new DOMRect(
      Math.min(marquee.startX, marquee.x),
      Math.min(marquee.startY, marquee.y),
      Math.abs(marquee.x - marquee.startX),
      Math.abs(marquee.y - marquee.startY)
    );
    const keys = [...elements.current.entries()]
      .filter(([, element]) =>
        intersects(selectionRect, element.getBoundingClientRect())
      )
      .map(([key]) => key);
    dispatch({ type: 'selectionChanged', source, keys });
    setMarquee(null);
  };

  const startMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest('[role=option]')
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMarquee({
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <section className="min-w-0 rounded-md bg-muted/30 p-1">
      <h4 className="sr-only">{title}</h4>
      <div className="flex h-7 items-center justify-end px-1">
        <span className="text-xs text-muted-foreground">{cases.length}</span>
        {removable && selectedKeys.length ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            title={t('removeCases')}
            aria-label={t('removeCases')}
            onClick={() =>
              dispatch({ type: 'removeUnassigned', keys: selectedKeys })
            }
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <div
        ref={(element) => {
          containerRef.current = element;
          drop(element);
        }}
        role="listbox"
        aria-multiselectable="true"
        aria-label={title}
        className="relative min-h-24 space-y-0.5"
        onPointerDown={startMarquee}
        onPointerMove={(event) =>
          setMarquee((current) =>
            current ? { ...current, x: event.clientX, y: event.clientY } : null
          )
        }
        onPointerUp={finishMarquee}
        onPointerCancel={() => setMarquee(null)}
      >
        {cases.length ? (
          cases.map((testcase) => {
            const key = testcaseKey(testcase);
            return (
              <CaseRow
                key={key}
                testcase={testcase}
                source={source}
                selected={selected.has(key)}
                selectedKeys={selectedKeys}
                targets={targets}
                register={(itemKey, element) => {
                  if (element) elements.current.set(itemKey, element);
                  else elements.current.delete(itemKey);
                }}
                onSelect={(additive) =>
                  dispatch({
                    type: 'selectionChanged',
                    source,
                    keys: additive
                      ? selected.has(key)
                        ? selectedKeys.filter((item) => item !== key)
                        : [...selectedKeys, key]
                      : [key],
                  })
                }
              />
            );
          })
        ) : (
          <p className="flex min-h-20 items-center justify-center px-3 text-center text-sm text-muted-foreground">
            {t('dropCases')}
          </p>
        )}
        {marquee ? (
          <div
            className="pointer-events-none fixed z-50 border border-primary bg-primary/10"
            style={{
              left: Math.min(marquee.startX, marquee.x),
              top: Math.min(marquee.startY, marquee.y),
              width: Math.abs(marquee.x - marquee.startX),
              height: Math.abs(marquee.y - marquee.startY),
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

function SubtaskColumn({
  subtask,
  ids,
}: {
  subtask: ProblemSubtask;
  ids: number[];
}) {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const [expanded, setExpanded] = useState(true);
  const id = subtask.id ?? 0;
  const remove = () => {
    const returned = subtask.cases ?? [];
    const subtasks = normalizeSubtaskScores(
      (state.config.subtasks ?? []).filter((item) => item.id !== id)
    );
    dispatch({
      type: 'configChanged',
      config: { ...state.config, subtasks },
    });
    dispatch({ type: 'addUnassigned', cases: returned });
  };
  return (
    <div className="min-w-64">
      <div className="mb-2 flex h-9 items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={expanded ? t('collapse') : t('expand')}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {t('subtask', { id })}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t('subtaskSummary', {
              score: subtask.score ?? 0,
              method: t(`scoring.${subtask.type ?? 'min'}`),
            })}
          </p>
        </div>
        <div className="ml-auto flex">
          <SubtaskSettingsDialog subtask={subtask} />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            title={t('deleteSubtask')}
            aria-label={t('deleteSubtask')}
            onClick={remove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {expanded ? (
        <CaseColumn
          source={id}
          title={t('assignedCases', { id })}
          cases={subtask.cases ?? []}
          targets={[null, ...ids.filter((target) => target !== id)]}
        />
      ) : (
        <button
          type="button"
          className="flex min-h-24 w-full cursor-pointer items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground"
          onClick={() => setExpanded(true)}
        >
          {t('testcaseCount', { count: subtask.cases?.length ?? 0 })}
        </button>
      )}
    </div>
  );
}

function SubtasksContent() {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const subtasks = useMemo(
    () => state.config.subtasks ?? [],
    [state.config.subtasks]
  );
  const ids = subtasks
    .map((subtask) => subtask.id)
    .filter((id): id is number => typeof id === 'number');
  const allKnown = useMemo(
    () =>
      new Set(
        [
          ...subtasks.flatMap((subtask) => subtask.cases ?? []),
          ...state.unassigned,
        ].map(testcaseKey)
      ),
    [state.unassigned, subtasks]
  );
  const addDetected = () => {
    const cases = detectTestcasePairs(
      state.testdata.map((file) => file.name),
      {}
    )
      .flatMap((subtask) => subtask.cases ?? [])
      .filter((testcase) => !allKnown.has(testcaseKey(testcase)));
    dispatch({ type: 'addUnassigned', cases });
  };
  const addSubtask = () => {
    let id = 1;
    while (ids.includes(id)) id += 1;
    const next = normalizeSubtaskScores([
      ...subtasks,
      { id, type: 'min' as const, cases: [] },
    ]);
    dispatch({
      type: 'configChanged',
      config: { ...state.config, subtasks: next },
    });
  };

  return (
    <div className="space-y-5" data-llm-visible="true">
      <div className="flex flex-wrap gap-2">
        <GlobalSettingsDialog />
        <Button type="button" variant="outline" onClick={addDetected}>
          <Sparkles />
          {t('autoDetect')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch({ type: 'autoConfigure' })}
        >
          <WandSparkles />
          {t('autoConfigure')}
        </Button>
        <ManualPairDialog />
        <Button type="button" onClick={addSubtask}>
          <Plus />
          {t('addSubtask')}
        </Button>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max items-start gap-4">
          <div className="w-64 min-w-64">
            <div className="mb-2 flex h-9 items-center">
              <p className="text-sm font-semibold">{t('unassigned')}</p>
            </div>
            <CaseColumn
              source={null}
              title={t('unassignedCases')}
              cases={state.unassigned}
              targets={ids}
              removable
            />
          </div>
          {subtasks.map((subtask) => (
            <SubtaskColumn key={subtask.id} subtask={subtask} ids={ids} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SubtasksConfigTab() {
  return (
    <DndProvider backend={HTML5Backend}>
      <SubtasksContent />
    </DndProvider>
  );
}
