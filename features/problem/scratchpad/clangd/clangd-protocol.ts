export type Position = { line: number; character: number };
export type Range = { start: Position; end: Position };
export type TextEdit = { range: Range; newText: string };
export type Markup =
  string | { kind?: string; language?: string; value: string };
export type Completion = {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: Markup;
  insertText?: string;
  insertTextFormat?: number;
  filterText?: string;
  sortText?: string;
  textEdit?: TextEdit;
  additionalTextEdits?: TextEdit[];
  data?: unknown;
};
export type CompletionResult =
  Completion[] | { items: Completion[]; isIncomplete?: boolean } | null;
export type Hover = { contents: Markup | Markup[]; range?: Range } | null;
export type Diagnostics = {
  uri: string;
  version?: number;
  diagnostics: {
    range: Range;
    severity?: number;
    message: string;
    code?: string | number;
  }[];
};
export type RpcMessage = {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
};
