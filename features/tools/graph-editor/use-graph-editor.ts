import { buildSvg, downloadText, exportPng } from './graph-export';
import { arrangeAsTree } from './graph-layout';
import {
  declaredCountIn,
  DEFAULT_ORIGIN,
  MAX_NODE_COUNT,
  nodeMapOf,
  parseGraphText,
  renumberGraph,
  serializeGraph,
  type ParsedGraph,
} from './graph-parse';
import { FALLBACK_COLORS, resolveColors } from './graph-theme';
import type {
  EditorMode,
  Graph,
  GraphStyle,
  IndexScheme,
  ResolvedColors,
} from './graph-types';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

const DEFAULT_TEXT = '5\n1 2\n2 3\n3 4\n4 5\n5 1\n2 4';

const DEFAULT_STYLE: GraphStyle = {
  nodeRadius: 18,
  edgeLength: 110,
  colors: { node: null, label: null, edge: null },
};

export function useGraphEditor() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [scheme, setScheme] = useState<IndexScheme>('one');
  const [directed, setDirected] = useState(false);
  const [mode, setMode] = useState<EditorMode>('force');
  const [style, setStyle] = useState<GraphStyle>(DEFAULT_STYLE);
  const [parsed, setParsed] = useState<ParsedGraph>(() =>
    parseGraphText(DEFAULT_TEXT, 'one')
  );
  const [colors, setColors] = useState<ResolvedColors>(FALLBACK_COLORS);

  // The canvas keeps mutating this graph in place (physics, dragging); commit
  // swaps in a new object so React re-renders while the ref stays current.
  const graphRef = useRef<ParsedGraph>(parsed);
  const viewportRef = useRef({ width: 640, height: 420 });

  const commit = (next: ParsedGraph) => {
    graphRef.current = next;
    setParsed(next);
  };

  const applyParse = (value: string, targetScheme: IndexScheme) => {
    const { width, height } = viewportRef.current;
    const origin = width > 0 ? { x: width / 2, y: height / 2 } : DEFAULT_ORIGIN;
    commit(
      parseGraphText(value, targetScheme, nodeMapOf(graphRef.current), origin)
    );
  };

  const onTextChange = (value: string) => {
    setText(value);
    applyParse(value, scheme);
  };

  const onSchemeChange = (next: IndexScheme) => {
    setScheme(next);
    const current = graphRef.current;
    if (next === 'custom') {
      // Labels carry over unchanged; the parse path preserves positions.
      const value = serializeGraph(current, 'custom');
      setText(value);
      applyParse(value, 'custom');
      return;
    }
    const renumbered = renumberGraph(current, next === 'zero' ? 0 : 1);
    commit({
      ...renumbered,
      declaredCount: renumbered.nodes.length,
      skipped: 0,
    });
    setText(serializeGraph(renumbered, next));
  };

  const onNodeCountChange = (count: number) => {
    const clamped = Math.max(
      0,
      Math.min(Math.round(count) || 0, MAX_NODE_COUNT)
    );
    const lines = text.split('\n');
    const first = lines.findIndex((line) => line.trim().length > 0);
    if (parsed.declaredCount !== null && first >= 0) {
      lines[first] = String(clamped);
    } else {
      lines.splice(first >= 0 ? first : 0, 0, String(clamped));
    }
    const value = lines.join('\n');
    setText(value);
    applyParse(value, scheme);
  };

  const onMutate = (recipe: (current: Graph) => Graph) => {
    const next = recipe(graphRef.current);
    const value = serializeGraph(next, scheme);
    setText(value);
    commit({
      ...next,
      declaredCount: declaredCountIn(value, scheme),
      skipped: 0,
    });
  };

  const setAllFixed = (fixed: boolean) => {
    for (const node of graphRef.current.nodes) node.fixed = fixed;
    commit({ ...graphRef.current });
  };

  const onTreeLayout = () => {
    arrangeAsTree(graphRef.current, {
      width: viewportRef.current.width,
      edgeLength: style.edgeLength,
    });
    commit({ ...graphRef.current });
  };

  const onExportPng = () =>
    exportPng(graphRef.current, {
      directed,
      nodeRadius: style.nodeRadius,
      colors,
    });

  const onExportSvg = () =>
    downloadText(
      'graph.svg',
      buildSvg(graphRef.current, {
        directed,
        nodeRadius: style.nodeRadius,
        colors,
      }),
      'image/svg+xml'
    );

  // resolvedTheme covers explicit theme switches and system-theme flips;
  // the frame delay lets the new theme's CSS variables land before they
  // are read back through getComputedStyle.
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setColors(resolveColors(style.colors));
    });
    return () => cancelAnimationFrame(raf);
  }, [style.colors, resolvedTheme]);

  return {
    text,
    scheme,
    directed,
    mode,
    style,
    colors,
    parsed,
    nodeCount: parsed.nodes.length,
    isEmpty: parsed.nodes.length === 0,
    skipped: parsed.skipped,
    graphRef,
    viewportRef,
    onTextChange,
    onSchemeChange,
    onDirectedChange: setDirected,
    onModeChange: setMode,
    onStyleChange: setStyle,
    onNodeCountChange,
    onMutate,
    onFixAll: () => setAllFixed(true),
    onUnfixAll: () => setAllFixed(false),
    onTreeLayout,
    onExportPng,
    onExportSvg,
  };
}

export type GraphEditorController = ReturnType<typeof useGraphEditor>;
