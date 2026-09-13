'use client';

import GraphEditorCanvas from './graph-editor-canvas';
import GraphEditorControls from './graph-editor-controls';
import { arrangeAsTree } from './graph-layout';
import {
  MAX_NODE_COUNT,
  nodeMapOf,
  parseGraphText,
  serializeGraph,
  serializeOrder,
} from './graph-parse';
import { buildSvg, downloadText, exportPng } from './graph-render';
import { resolveColors } from './graph-theme';
import type {
  EditorMode,
  Graph,
  GraphNode,
  GraphStyle,
  IndexScheme,
  ResolvedColors,
} from './graph-types';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const DEFAULT_TEXT = '5\n1 2\n2 3\n3 4\n4 5\n5 1\n2 4';

const FALLBACK_COLORS: ResolvedColors = {
  node: '#ffffff',
  label: '#1a1a1a',
  edge: '#1a1a1a',
  background: '#ffffff',
};

const DEFAULT_STYLE: GraphStyle = {
  nodeRadius: 18,
  edgeLength: 110,
  colors: { node: null, label: null, edge: null },
};

export default function GraphEditor() {
  const t = useTranslations('graphEditor');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [scheme, setScheme] = useState<IndexScheme>('one');
  const [directed, setDirected] = useState(false);
  const [mode, setMode] = useState<EditorMode>('force');
  const [style, setStyle] = useState<GraphStyle>(DEFAULT_STYLE);
  const [graph, setGraph] = useState<Graph>(() =>
    parseGraphText(DEFAULT_TEXT, 'one')
  );
  const [declaredCount, setDeclaredCount] = useState<number | null>(5);
  const [skipped, setSkipped] = useState(0);
  const [colors, setColors] = useState<ResolvedColors>(FALLBACK_COLORS);

  const graphRef = useRef(graph);
  const viewportRef = useRef({ width: 640, height: 420 });

  const spawnOrigin = () => {
    const { width, height } = viewportRef.current;
    return width > 0 ? { x: width / 2, y: height / 2 } : { x: 320, y: 220 };
  };

  const applyParse = (
    value: string,
    targetScheme: IndexScheme,
    previous?: ReadonlyMap<string, GraphNode>
  ) => {
    const parsed = parseGraphText(
      value,
      targetScheme,
      previous ?? nodeMapOf(graphRef.current),
      spawnOrigin()
    );
    graphRef.current = parsed;
    setGraph(parsed);
    setDeclaredCount(parsed.declaredCount);
    setSkipped(parsed.skipped);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    applyParse(value, scheme);
  };

  const handleSchemeChange = (next: IndexScheme) => {
    setScheme(next);
    const value = serializeGraph(graphRef.current, next);
    setText(value);
    if (next === 'custom') {
      applyParse(value, next);
      return;
    }
    const offset = next === 'zero' ? 0 : 1;
    const remapped = new Map(
      serializeOrder(graphRef.current).map((node, index) => [
        String(index + offset),
        node,
      ])
    );
    applyParse(value, next, remapped);
  };

  const handleNodeCountChange = (count: number) => {
    const clamped = Math.max(
      0,
      Math.min(Math.round(count) || 0, MAX_NODE_COUNT)
    );
    const lines = text.split('\n');
    const first = lines.findIndex((line) => line.trim().length > 0);
    if (declaredCount !== null && first >= 0) {
      lines[first] = String(clamped);
    } else {
      lines.splice(first >= 0 ? first : 0, 0, String(clamped));
    }
    const value = lines.join('\n');
    setText(value);
    applyParse(value, scheme);
  };

  const mutateGraph = (recipe: (current: Graph) => Graph) => {
    const next = recipe(graphRef.current);
    graphRef.current = next;
    const serialized = serializeGraph(next, scheme);
    setText(serialized);
    if (scheme === 'custom') {
      setGraph(next);
      setDeclaredCount(null);
      setSkipped(0);
      return;
    }
    const offset = scheme === 'zero' ? 0 : 1;
    const previous = new Map(
      serializeOrder(next).map((node, index) => [String(index + offset), node])
    );
    applyParse(serialized, scheme, previous);
  };

  const setAllFixed = (fixed: boolean) => {
    for (const node of graphRef.current.nodes) node.fixed = fixed;
    setGraph({ ...graphRef.current });
  };

  const handleTreeLayout = () => {
    arrangeAsTree(graphRef.current, {
      width: viewportRef.current.width,
      edgeLength: style.edgeLength,
    });
    setGraph({ ...graphRef.current });
  };

  useEffect(() => {
    const update = () => setColors(resolveColors(style.colors));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
    return () => observer.disconnect();
  }, [style.colors]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row" data-llm-visible="true">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="text-xl font-semibold">{t('name')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
        <GraphEditorCanvas
          graph={graph}
          graphRef={graphRef}
          viewportRef={viewportRef}
          mode={mode}
          directed={directed}
          scheme={scheme}
          style={style}
          colors={colors}
          onMutate={mutateGraph}
        />
      </div>
      <GraphEditorControls
        text={text}
        onTextChange={handleTextChange}
        scheme={scheme}
        onSchemeChange={handleSchemeChange}
        directed={directed}
        onDirectedChange={setDirected}
        mode={mode}
        onModeChange={setMode}
        style={style}
        onStyleChange={setStyle}
        colors={colors}
        nodeCount={declaredCount ?? graph.nodes.length}
        onNodeCountChange={handleNodeCountChange}
        skipped={skipped}
        onFixAll={() => setAllFixed(true)}
        onUnfixAll={() => setAllFixed(false)}
        onTreeLayout={handleTreeLayout}
        onExportPng={() =>
          exportPng(graphRef.current, {
            directed,
            nodeRadius: style.nodeRadius,
            colors,
          })
        }
        onExportSvg={() =>
          downloadText(
            'graph.svg',
            buildSvg(graphRef.current, {
              directed,
              nodeRadius: style.nodeRadius,
              colors,
            }),
            'image/svg+xml'
          )
        }
      />
    </div>
  );
}
