'use client';

import { useProblemConfig } from './problem-config-context';
import CodeEditor from '@/shared/components/code/code-editor';
import type { OnMount } from '@monaco-editor/react';
import { diffLines } from 'diff';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

type EditorInstance = Parameters<OnMount>[0];
type EditOperation = Parameters<EditorInstance['executeEdits']>[1][number];

function applyLineEdits(instance: EditorInstance, next: string) {
  const model = instance.getModel();
  if (!model || model.getValue() === next) return;
  let line = 1;
  const edits: EditOperation[] = [];
  for (const part of diffLines(model.getValue(), next)) {
    const count = part.count ?? 0;
    if (part.added) {
      edits.push({
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 1,
        },
        text: part.value,
      });
    } else if (part.removed) {
      edits.push({
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: Math.min(line + count, model.getLineCount() + 1),
          endColumn: 1,
        },
        text: '',
      });
      line += count;
    } else {
      line += count;
    }
  }
  instance.executeEdits('problem-config-form', edits);
}

export default function ConfigYamlEditor() {
  const t = useTranslations('problem.config');
  const { state, dispatch } = useProblemConfig();
  const editorRef = useRef<EditorInstance | null>(null);
  const applyingFormUpdate = useRef(false);

  useEffect(() => {
    if (!editorRef.current || editorRef.current.getValue() === state.raw)
      return;
    applyingFormUpdate.current = true;
    applyLineEdits(editorRef.current, state.raw);
    queueMicrotask(() => {
      applyingFormUpdate.current = false;
    });
  }, [state.raw]);

  return (
    <CodeEditor
      value={state.raw}
      language="yaml"
      height="100%"
      invalid={!state.valid}
      ariaLabel={t('yamlEditor')}
      path="problem-config.yaml"
      className="h-full min-h-96 rounded-none border-0"
      onMount={(instance) => {
        editorRef.current = instance;
      }}
      onChange={(raw) => {
        if (!applyingFormUpdate.current) dispatch({ type: 'rawChanged', raw });
      }}
    />
  );
}
