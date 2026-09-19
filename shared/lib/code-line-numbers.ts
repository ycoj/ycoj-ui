import type { ElementContent } from 'hast';

const LINE_NUMBERS_SUFFIX = '|line-numbers';
const NO_LINE_NUMBERS_SUFFIX = '|no-line-numbers';

export const LINE_NUMBER_DIGITS_VARIABLE = '--code-line-number-digits';

/**
 * Splits a language tag such as `cpp`, `cpp|line-numbers`, or
 * `cpp|no-line-numbers` into the real language and the explicit line-number
 * choice. `lineNumbers` is left `undefined` when the tag carries no flag so
 * each caller can apply its own default.
 */
export function parseCodeLanguage(language: string): {
  language: string;
  lineNumbers?: boolean;
} {
  if (language.endsWith(NO_LINE_NUMBERS_SUFFIX)) {
    return {
      language: language.slice(0, -NO_LINE_NUMBERS_SUFFIX.length),
      lineNumbers: false,
    };
  }
  if (language.endsWith(LINE_NUMBERS_SUFFIX)) {
    return {
      language: language.slice(0, -LINE_NUMBERS_SUFFIX.length),
      lineNumbers: true,
    };
  }
  return { language };
}

// Languages that render line numbers by default: the programming, markup,
// and configuration languages commonly fenced in site content. Plain-text
// flags and unrecognized languages do not number their lines unless the tag
// carries an explicit `|line-numbers` flag.
const COMMON_CODE_LANGUAGES = new Set([
  'c',
  'cc',
  'cpp',
  'c++',
  'cs',
  'csharp',
  'java',
  'python',
  'py',
  'javascript',
  'js',
  'jsx',
  'typescript',
  'ts',
  'tsx',
  'go',
  'golang',
  'rust',
  'rs',
  'kotlin',
  'kt',
  'swift',
  'ruby',
  'rb',
  'php',
  'scala',
  'lua',
  'perl',
  'pl',
  'haskell',
  'hs',
  'pascal',
  'ocaml',
  'erlang',
  'elixir',
  'clojure',
  'dart',
  'r',
  'bash',
  'sh',
  'shell',
  'zsh',
  'sql',
  'html',
  'css',
  'scss',
  'less',
  'xml',
  'markdown',
  'md',
  'latex',
  'tex',
  'json',
  'yaml',
  'yml',
  'toml',
  'ini',
  'dockerfile',
  'docker',
  'makefile',
  'diff',
  'graphql',
]);

/**
 * Whether the language is a common code language that renders line numbers
 * by default. Matched case-insensitively against the flag written on the
 * fence.
 */
export function isCommonCodeLanguage(language: string): boolean {
  return COMMON_CODE_LANGUAGES.has(language.toLowerCase());
}

const LINE_BREAK = /(\r\n|[\n\r])/;

type SplitLines = {
  lines: ElementContent[][];
  // breaks[i] is the separator between lines[i] and lines[i + 1], kept so
  // the emitted text preserves the source's own line endings.
  breaks: string[];
};

function splitLines(children: ElementContent[]): SplitLines {
  const lines: ElementContent[][] = [[]];
  const breaks: string[] = [];
  const current = () => lines[lines.length - 1]!;
  const breakLine = (separator: string) => {
    breaks.push(separator);
    lines.push([]);
  };

  const append = (node: ElementContent) => {
    if (node.type === 'text') {
      // The capturing group leaves each matched separator at odd indices.
      node.value.split(LINE_BREAK).forEach((part, index) => {
        if (index % 2 === 1) {
          breakLine(part);
          return;
        }
        if (part) current().push({ type: 'text', value: part });
      });
      return;
    }
    if (node.type === 'element') {
      // Elements spanning line breaks (e.g. a multi-line comment token) are
      // cloned once per covered line so the per-line wrappers nest correctly.
      const split = splitLines(node.children);
      if (split.lines.length === 1) {
        current().push(node);
        return;
      }
      split.lines.forEach((segment, index) => {
        if (index > 0) breakLine(split.breaks[index - 1]!);
        if (segment.length > 0) current().push({ ...node, children: segment });
      });
      return;
    }
    current().push(node);
  };

  children.forEach(append);
  return { lines, breaks };
}

export type NumberedLines = {
  children: ElementContent[];
  lineNumberDigits: number;
};

/**
 * Wraps each line of highlighted code content in a `span.code-line` element.
 * The source's own line separators are re-emitted as text nodes between the
 * wrappers so `textContent`, copy, and selection reproduce it unchanged.
 */
export function addLineNumbers(children: ElementContent[]): NumberedLines {
  const { lines, breaks } = splitLines(children);
  // A source ending in a line break yields one trailing empty segment; drop
  // it so the block does not render a phantom empty numbered line.
  const trailingBreak =
    lines.length > 1 && lines[lines.length - 1]!.length === 0;
  if (trailingBreak) lines.pop();
  // An empty source would still emit one wrapper — a lone `1` gutter.
  if (lines.length === 1 && lines[0]!.length === 0) {
    return {
      children: trailingBreak
        ? [{ type: 'text', value: breaks[breaks.length - 1]! }]
        : [],
      lineNumberDigits: 1,
    };
  }

  const out: ElementContent[] = [];
  lines.forEach((line, index) => {
    if (index > 0) out.push({ type: 'text', value: breaks[index - 1]! });
    out.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['code-line'] },
      children: line,
    });
  });
  if (trailingBreak) {
    out.push({ type: 'text', value: breaks[breaks.length - 1]! });
  }

  return {
    children: out,
    lineNumberDigits: String(lines.length).length,
  };
}
