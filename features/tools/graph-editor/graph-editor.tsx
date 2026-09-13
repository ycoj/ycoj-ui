'use client';

import GraphEditorCanvas from './graph-editor-canvas';
import GraphInputCard from './graph-input-card';
import GraphSettingsCard from './graph-settings-card';
import { useGraphEditor } from './use-graph-editor';
import { useTranslations } from 'next-intl';

export default function GraphEditor() {
  const t = useTranslations('graphEditor');
  const editor = useGraphEditor();

  return (
    <div className="flex flex-col gap-4 lg:flex-row" data-llm-visible="true">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="text-xl font-semibold">{t('name')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
        <GraphEditorCanvas
          graphRef={editor.graphRef}
          viewportRef={editor.viewportRef}
          isEmpty={editor.isEmpty}
          mode={editor.mode}
          directed={editor.directed}
          scheme={editor.scheme}
          style={editor.style}
          colors={editor.colors}
          onMutate={editor.onMutate}
        />
      </div>
      <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
        <GraphInputCard editor={editor} />
        <GraphSettingsCard editor={editor} />
      </div>
    </div>
  );
}
