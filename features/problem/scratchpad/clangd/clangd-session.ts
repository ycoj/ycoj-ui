import { ClangdConnection } from './clangd-connection';
import type {
  CompletionResult,
  Diagnostics,
  Hover,
  Markup,
  Range,
} from './clangd-protocol';
import type { ClangdStatus } from './clangd-support';
import type { OnMount } from '@monaco-editor/react';
import type * as MonacoApi from 'monaco-editor';

type Editor = Parameters<OnMount>[0];
const uri = 'file:///workspace/main.cpp';
const markerOwner = 'scratchpad-clangd';
const range = (value: Range) => ({
  startLineNumber: value.start.line + 1,
  startColumn: value.start.character + 1,
  endLineNumber: value.end.line + 1,
  endColumn: value.end.character + 1,
});
const markdown = (value: Markup) => ({
  value:
    typeof value === 'string'
      ? value
      : value.language
        ? `\`\`\`${value.language}\n${value.value}\n\`\`\``
        : value.value,
  isTrusted: false,
});

export function startClangdSession(
  editor: Editor,
  monaco: typeof MonacoApi,
  standard: string,
  onStatus: (status: ClangdStatus) => void
) {
  const model = editor.getModel();
  if (!model) throw new Error('Editor model unavailable');
  let disposed = false;
  let version = 1;
  let syncedVersion = model.getVersionId();
  let changeTimer: ReturnType<typeof setTimeout> | undefined;
  const subscriptions: { dispose: () => void }[] = [];
  onStatus('loading');

  const severityByLsp: Record<number, MonacoApi.MarkerSeverity> = {
    1: monaco.MarkerSeverity.Error,
    2: monaco.MarkerSeverity.Warning,
    3: monaco.MarkerSeverity.Info,
    4: monaco.MarkerSeverity.Hint,
  };
  const connection = new ClangdConnection(
    new Worker('/clangd/worker.mjs', {
      type: 'module',
      name: 'scratchpad-clangd',
    }),
    standard,
    (message) => {
      if (
        message.method !== 'textDocument/publishDiagnostics' ||
        disposed ||
        model.isDisposed()
      )
        return;
      const params = message.params as Diagnostics;
      if (
        params.uri !== uri ||
        syncedVersion !== model.getVersionId() ||
        (params.version !== undefined && params.version !== version)
      )
        return;
      monaco.editor.setModelMarkers(
        model,
        markerOwner,
        params.diagnostics.map((diagnostic) => ({
          ...range(diagnostic.range),
          message: diagnostic.message,
          source: 'clangd',
          code:
            diagnostic.code === undefined ? undefined : String(diagnostic.code),
          severity:
            severityByLsp[diagnostic.severity ?? 1] ??
            monaco.MarkerSeverity.Error,
        }))
      );
    },
    () => {
      dispose();
      onStatus('failed');
    }
  );

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimeout(changeTimer);
    for (const subscription of subscriptions) subscription.dispose();
    connection.dispose();
    if (!model!.isDisposed())
      monaco.editor.setModelMarkers(model!, markerOwner, []);
  }

  function sync() {
    clearTimeout(changeTimer);
    if (
      disposed ||
      model!.isDisposed() ||
      syncedVersion === model!.getVersionId()
    )
      return;
    syncedVersion = model!.getVersionId();
    connection.notify('textDocument/didChange', {
      textDocument: { uri, version: ++version },
      contentChanges: [{ text: model!.getValue() }],
    });
  }

  function isStale(
    current: MonacoApi.editor.ITextModel,
    requestedVersion: number
  ) {
    return (
      disposed ||
      current.isDisposed() ||
      current.getVersionId() !== requestedVersion
    );
  }

  function requestWithCancellation<T>(
    token: MonacoApi.CancellationToken,
    run: (signal: AbortSignal) => Promise<T>
  ) {
    const abort = new AbortController();
    const cancellation = token.onCancellationRequested(() => abort.abort());
    if (token.isCancellationRequested) abort.abort();
    return run(abort.signal).finally(() => cancellation.dispose());
  }

  async function requestPositionInfo<T>(
    method: string,
    current: MonacoApi.editor.ITextModel,
    position: MonacoApi.Position,
    token: MonacoApi.CancellationToken
  ): Promise<T | undefined> {
    if (current !== model || disposed) return undefined;
    sync();
    const requestedVersion = current.getVersionId();
    try {
      const result = await requestWithCancellation(token, (signal) =>
        connection.request<T>(
          method,
          {
            textDocument: { uri },
            position: {
              line: position.lineNumber - 1,
              character: position.column - 1,
            },
          },
          signal
        )
      );
      if (!result || isStale(current, requestedVersion)) return undefined;
      return result;
    } catch {
      return undefined;
    }
  }

  async function initialize() {
    await connection.ready;
    if (disposed) return;
    await connection.request('initialize', {
      processId: null,
      rootUri: 'file:///workspace',
      capabilities: {
        general: { positionEncodings: ['utf-16'] },
        textDocument: {
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
            },
          },
          hover: { contentFormat: ['markdown', 'plaintext'] },
          publishDiagnostics: { versionSupport: true },
        },
      },
    });
    if (disposed || model!.isDisposed()) return;
    connection.notify('initialized', {});
    syncedVersion = model!.getVersionId();
    connection.notify('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId: 'cpp',
        version,
        text: model!.getValue(),
      },
    });
    subscriptions.push(
      model!.onDidChangeContent(() => {
        monaco.editor.setModelMarkers(model!, markerOwner, []);
        clearTimeout(changeTimer);
        changeTimer = setTimeout(sync, 300);
      })
    );
    const kinds = monaco.languages.CompletionItemKind;
    const completionKinds: Record<
      number,
      MonacoApi.languages.CompletionItemKind
    > = {
      1: kinds.Text,
      2: kinds.Method,
      3: kinds.Function,
      4: kinds.Constructor,
      5: kinds.Field,
      6: kinds.Variable,
      7: kinds.Class,
      8: kinds.Interface,
      9: kinds.Module,
      10: kinds.Property,
      11: kinds.Unit,
      12: kinds.Value,
      13: kinds.Enum,
      14: kinds.Keyword,
      15: kinds.Snippet,
      16: kinds.Color,
      17: kinds.File,
      18: kinds.Reference,
      19: kinds.Folder,
      20: kinds.EnumMember,
      21: kinds.Constant,
      22: kinds.Struct,
      23: kinds.Event,
      24: kinds.Operator,
      25: kinds.TypeParameter,
    };
    subscriptions.push(
      monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', '>', ':'],
        async provideCompletionItems(current, position, _context, token) {
          const result = await requestPositionInfo<CompletionResult>(
            'textDocument/completion',
            current,
            position,
            token
          );
          if (!result) return { suggestions: [] };
          const word = current.getWordUntilPosition(position);
          return {
            incomplete: !Array.isArray(result) && result.isIncomplete,
            suggestions: (Array.isArray(result) ? result : result.items).map(
              (item) => ({
                label: item.label,
                kind: completionKinds[item.kind ?? 1] ?? kinds.Text,
                detail: item.detail,
                documentation: item.documentation
                  ? markdown(item.documentation)
                  : undefined,
                insertText:
                  item.textEdit?.newText ?? item.insertText ?? item.label,
                insertTextRules:
                  item.insertTextFormat === 2
                    ? monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet
                    : undefined,
                filterText: item.filterText,
                sortText: item.sortText,
                range: item.textEdit
                  ? range(item.textEdit.range)
                  : {
                      startLineNumber: position.lineNumber,
                      endLineNumber: position.lineNumber,
                      startColumn: word.startColumn,
                      endColumn: word.endColumn,
                    },
                additionalTextEdits: item.additionalTextEdits?.map((edit) => ({
                  range: range(edit.range),
                  text: edit.newText,
                })),
              })
            ),
          };
        },
      })
    );
    subscriptions.push(
      monaco.languages.registerHoverProvider('cpp', {
        async provideHover(current, position, token) {
          const result = await requestPositionInfo<Hover>(
            'textDocument/hover',
            current,
            position,
            token
          );
          if (!result) return null;
          return {
            range: result.range ? range(result.range) : undefined,
            contents: (Array.isArray(result.contents)
              ? result.contents
              : [result.contents]
            ).map(markdown),
          };
        },
      })
    );
    onStatus('ready');
  }
  subscriptions.push(
    model.onWillDispose(dispose),
    editor.onDidChangeModel(dispose)
  );
  void initialize().catch(() => {
    if (disposed) return;
    dispose();
    onStatus('failed');
  });
  return { dispose };
}
