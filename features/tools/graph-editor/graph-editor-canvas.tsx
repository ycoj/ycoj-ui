'use client';

import { edgeAt, edgeMidpoint, edgeShapes, nodeAt } from './graph-geometry';
import { createEdgeId, isUsableLabel, nextNodeLabel } from './graph-parse';
import { stepPhysics } from './graph-physics';
import { drawGraph } from './graph-render';
import type {
  EditorMode,
  Graph,
  GraphEdge,
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
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

type EditingState =
  | { kind: 'node'; nodeId: string; x: number; y: number; value: string }
  | { kind: 'edge'; edgeId: string; x: number; y: number; value: string };

type DragState = {
  nodeId: string;
  startX: number;
  startY: number;
  moved: boolean;
};

type Viewport = { width: number; height: number };

type Props = {
  graph: Graph;
  graphRef: RefObject<Graph>;
  viewportRef: RefObject<Viewport>;
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
  graph,
  graphRef,
  viewportRef,
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

  const live = useRef({ mode, directed, scheme, style, colors, onMutate });
  useEffect(() => {
    live.current = { mode, directed, scheme, style, colors, onMutate };
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
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        if (currentMode === 'force') {
          stepPhysics(graphRef.current, {
            edgeLength: currentStyle.edgeLength,
            width,
            height,
          });
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        drawGraph(ctx, graphRef.current, {
          directed: isDirected,
          nodeRadius: currentStyle.nodeRadius,
          colors: currentColors,
          draft: draftRef.current
            ? {
                sourceId: draftRef.current,
                x: pointerRef.current.x,
                y: pointerRef.current.y,
              }
            : null,
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [graphRef]);

  const canvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const {
      mode: currentMode,
      scheme: currentScheme,
      style: currentStyle,
    } = live.current;
    const { x, y } = canvasPoint(event);
    const current = graphRef.current;
    const node = nodeAt(current, x, y, currentStyle.nodeRadius);

    if (currentMode === 'force') {
      if (node) {
        dragRef.current = {
          nodeId: node.id,
          startX: x,
          startY: y,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }

    if (currentMode === 'draw') {
      if (node) {
        const pending = draftRef.current;
        if (pending === null) {
          draftRef.current = node.id;
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
              target: node.id,
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
      const label = nextNodeLabel(current, currentScheme);
      onMutate((g) => ({
        ...g,
        nodes: [
          ...g.nodes,
          { id: label, label, x, y, fixed: false, vx: 0, vy: 0 },
        ],
      }));
      return;
    }

    if (currentMode === 'edit') {
      if (node) {
        setEditing({
          kind: 'node',
          nodeId: node.id,
          x: node.x,
          y: node.y,
          value: node.label,
        });
        return;
      }
      const edge = edgeAt(current, x, y, currentStyle.nodeRadius);
      if (edge) {
        const shape = edgeShapes(current, currentStyle.nodeRadius).find(
          (item) => item.edge === edge
        )?.shape;
        const mid = shape ? edgeMidpoint(shape) : { x, y };
        setEditing({
          kind: 'edge',
          edgeId: edge.id,
          x: mid.x,
          y: mid.y,
          value: edge.weight,
        });
      }
      return;
    }

    if (currentMode === 'delete') {
      if (node) {
        onMutate((g) => ({
          nodes: g.nodes.filter((item) => item.id !== node.id),
          edges: g.edges.filter(
            (item) => item.source !== node.id && item.target !== node.id
          ),
        }));
        return;
      }
      const edge = edgeAt(current, x, y, currentStyle.nodeRadius);
      if (edge) {
        onMutate((g) => ({
          ...g,
          edges: g.edges.filter((item) => item.id !== edge.id),
        }));
      }
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasPoint(event);
    pointerRef.current = { x, y };
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) > 4) {
      drag.moved = true;
    }
    if (drag.moved) {
      const node = graphRef.current.nodes.find(
        (item) => item.id === drag.nodeId
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
    if (!drag) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const node = graphRef.current.nodes.find((item) => item.id === drag.nodeId);
    if (!node) return;
    node.fixed = drag.moved ? true : !node.fixed;
  };

  const commitEditing = () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (editing.kind === 'node') {
      const previousId = editing.nodeId;
      if (
        value !== previousId &&
        isUsableLabel(graphRef.current, live.current.scheme, value, previousId)
      ) {
        onMutate((g) => ({
          nodes: g.nodes.map((node) =>
            node.id === previousId ? { ...node, id: value, label: value } : node
          ),
          edges: g.edges.map((edge) => ({
            ...edge,
            source: edge.source === previousId ? value : edge.source,
            target: edge.target === previousId ? value : edge.target,
          })),
        }));
      }
    } else {
      const edgeId = editing.edgeId;
      onMutate((g) => ({
        ...g,
        edges: g.edges.map((edge: GraphEdge) =>
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
      {graph.nodes.length === 0 && (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 grid place-content-center text-sm">
          {t('emptyHint')}
        </div>
      )}
    </div>
  );
}
