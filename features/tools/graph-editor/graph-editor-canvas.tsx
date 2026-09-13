'use client';

import { edgeAt, edgeMidpoint, nodeAt } from './graph-geometry';
import {
  createEdgeId,
  isUsableLabel,
  MAX_NODE_COUNT,
  nextNodeLabel,
  type ParsedGraph,
} from './graph-parse';
import { stepPhysics } from './graph-physics';
import { drawGraph } from './graph-render';
import type {
  EditorMode,
  Graph,
  GraphStyle,
  IndexScheme,
  ResolvedColors,
} from './graph-types';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

type EditingState =
  | { kind: 'node'; nodeLabel: string; x: number; y: number; value: string }
  | { kind: 'edge'; edgeId: string; x: number; y: number; value: string };

type DragState = {
  nodeLabel: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type Viewport = { width: number; height: number };

// The graph behind graphRef is mutated in place by the physics loop and
// drags; commits swap in a fresh object and re-render, so props act as
// invalidation signals rather than the drawing source of truth.
type Props = {
  // Commit token, never read: a fresh object per commit guarantees a
  // re-render even for in-place commits like setAllFixed — and keeps
  // doing so if the canvas is ever wrapped in React.memo. The dep-less
  // effect below then turns each render into a wake for the rAF loop.
  graph: ParsedGraph;
  graphRef: RefObject<ParsedGraph>;
  viewportRef: RefObject<Viewport>;
  isEmpty: boolean;
  mode: EditorMode;
  directed: boolean;
  scheme: IndexScheme;
  style: GraphStyle;
  colors: ResolvedColors;
  onMutate: (recipe: (graph: Graph) => Graph) => void;
};

const CURSOR_BY_MODE: Record<EditorMode, string> = {
  force: 'cursor-grab',
  draw: 'cursor-crosshair',
  edit: 'cursor-pointer',
  delete: 'cursor-pointer',
};

export default function GraphEditorCanvas({
  graphRef,
  viewportRef,
  isEmpty,
  mode,
  directed,
  scheme,
  style,
  colors,
  onMutate,
}: Props) {
  const t = useTranslations('graphEditor');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const draftRef = useRef<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const asleepRef = useRef(false);

  // Only the rAF loop reads through this ref; React event handlers use
  // props directly so they never observe pre-effect values.
  const live = useRef({ mode, directed, style, colors });
  // Dep-less on purpose: `graph` guarantees a render per commit and every
  // render re-wakes the settled loop, so no dep list can miss a field.
  useEffect(() => {
    live.current = { mode, directed, style, colors };
    asleepRef.current = false;
  });

  const [prevMode, setPrevMode] = useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setEditing(null);
  }

  useEffect(() => {
    draftRef.current = null;
    dragRef.current = null;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      viewportRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      // Resizing clears the bitmap; wake the loop to repaint once.
      asleepRef.current = false;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [viewportRef]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const {
          mode: currentMode,
          directed: isDirected,
          style: currentStyle,
          colors: currentColors,
        } = live.current;
        // Once the layout settles in force mode — or after a single paint
        // in the other modes — stop redrawing until a commit or pointer
        // interaction wakes the loop again.
        if (!asleepRef.current) {
          const dpr = window.devicePixelRatio || 1;
          const width = canvas.width / dpr;
          const height = canvas.height / dpr;
          if (currentMode === 'force') {
            asleepRef.current = !stepPhysics(graphRef.current, {
              edgeLength: currentStyle.edgeLength,
              width,
              height,
            });
          } else {
            asleepRef.current = true;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, width, height);
          drawGraph(ctx, graphRef.current, {
            directed: isDirected,
            nodeRadius: currentStyle.nodeRadius,
            colors: currentColors,
            draft: draftRef.current
              ? {
                  sourceLabel: draftRef.current,
                  x: pointerRef.current.x,
                  y: pointerRef.current.y,
                }
              : null,
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [graphRef]);

  const canvasPoint = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    asleepRef.current = false;
    const { x, y } = canvasPoint(event);
    const current = graphRef.current;
    const node = nodeAt(current, x, y, style.nodeRadius);

    if (mode === 'force') {
      if (node) {
        dragRef.current = {
          nodeLabel: node.label,
          pointerId: event.pointerId,
          startX: x,
          startY: y,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }

    if (mode === 'draw') {
      if (node) {
        const pending = draftRef.current;
        if (pending === null) {
          draftRef.current = node.label;
          return;
        }
        draftRef.current = null;
        onMutate((g) => ({
          ...g,
          edges: [
            ...g.edges,
            {
              id: createEdgeId(),
              source: pending,
              target: node.label,
              weight: '',
            },
          ],
        }));
        return;
      }
      if (draftRef.current !== null) {
        draftRef.current = null;
        return;
      }
      if (current.nodes.length >= MAX_NODE_COUNT) return;
      const label = nextNodeLabel(current, scheme);
      onMutate((g) => ({
        ...g,
        nodes: [...g.nodes, { label, x, y, fixed: false, vx: 0, vy: 0 }],
      }));
      return;
    }

    if (mode === 'edit') return;

    if (mode === 'delete') {
      if (node) {
        onMutate((g) => ({
          nodes: g.nodes.filter((item) => item.label !== node.label),
          edges: g.edges.filter(
            (item) => item.source !== node.label && item.target !== node.label
          ),
        }));
        return;
      }
      const hit = edgeAt(current, x, y, style.nodeRadius);
      if (hit) {
        const edgeId = hit.edge.id;
        onMutate((g) => ({
          ...g,
          edges: g.edges.filter((item) => item.id !== edgeId),
        }));
      }
    }
  };

  const handleClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit') return;
    const { x, y } = canvasPoint(event);
    const current = graphRef.current;
    const node = nodeAt(current, x, y, style.nodeRadius);
    if (node) {
      setEditing({
        kind: 'node',
        nodeLabel: node.label,
        x: node.x,
        y: node.y,
        value: node.label,
      });
      return;
    }
    const hit = edgeAt(current, x, y, style.nodeRadius);
    if (hit) {
      const mid = edgeMidpoint(hit.shape);
      setEditing({
        kind: 'edge',
        edgeId: hit.edge.id,
        x: mid.x,
        y: mid.y,
        value: hit.edge.weight,
      });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasPoint(event);
    pointerRef.current = { x, y };
    // Wake even without an active drag: the draw-mode draft edge follows
    // the cursor, and every other mode may sleep between paints.
    asleepRef.current = false;
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) > 4) {
      drag.moved = true;
    }
    if (drag.moved) {
      const node = graphRef.current.nodes.find(
        (item) => item.label === drag.nodeLabel
      );
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
      }
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    // A second pointer's release must not end the drag or toggle `fixed`.
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    asleepRef.current = false;
    // pointercancel reaches here after the capture was already released;
    // releasing an inactive capture throws NotFoundError.
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const node = graphRef.current.nodes.find(
      (item) => item.label === drag.nodeLabel
    );
    if (!node) return;
    node.fixed = drag.moved ? true : !node.fixed;
  };

  const commitEditing = () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (editing.kind === 'node') {
      const previousLabel = editing.nodeLabel;
      if (
        value !== previousLabel &&
        isUsableLabel(graphRef.current, scheme, value, previousLabel)
      ) {
        onMutate((g) => ({
          nodes: g.nodes.map((node) =>
            node.label === previousLabel ? { ...node, label: value } : node
          ),
          edges: g.edges.map((edge) => ({
            ...edge,
            source: edge.source === previousLabel ? value : edge.source,
            target: edge.target === previousLabel ? value : edge.target,
          })),
        }));
      }
    } else {
      const edgeId = editing.edgeId;
      onMutate((g) => ({
        ...g,
        edges: g.edges.map((edge) =>
          edge.id === edgeId ? { ...edge, weight: value } : edge
        ),
      }));
    }
    setEditing(null);
  };

  return (
    <div
      ref={wrapRef}
      className="bg-card/40 relative min-h-[320px] flex-1 overflow-hidden rounded-xl border"
      data-llm-visible="true"
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 h-full w-full touch-none',
          CURSOR_BY_MODE[mode]
        )}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {editing && (
        <input
          autoFocus
          value={editing.value}
          onChange={(event) =>
            setEditing({ ...editing, value: event.target.value })
          }
          onBlur={commitEditing}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitEditing();
            if (event.key === 'Escape') setEditing(null);
          }}
          style={{ left: editing.x, top: editing.y }}
          className="border-input bg-background absolute z-10 h-7 w-24 -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 text-center text-sm shadow-sm outline-none"
          aria-label={
            editing.kind === 'node' ? t('renameNode') : t('editWeight')
          }
        />
      )}
      {isEmpty && (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 grid place-content-center text-sm">
          {t('emptyHint')}
        </div>
      )}
    </div>
  );
}
