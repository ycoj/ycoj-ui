import type { ElementContent } from 'hast';

export const NO_LINE_NUMBERS_SUFFIX = '|no-line-numbers';

/**
 * Splits a language tag such as `cpp|no-line-numbers` into the real language
 * and whether the code block should render line numbers (on by default).
 */
export function parseCodeLanguage(language: string): {
  language: string;
  lineNumbers: boolean;
} {
  if (!language.endsWith(NO_LINE_NUMBERS_SUFFIX)) {
    return { language, lineNumbers: true };
  }
  return {
    language: language.slice(0, -NO_LINE_NUMBERS_SUFFIX.length),
    lineNumbers: false,
  };
}

const LINE_BREAK = /\r\n|[\n\r]/;

function splitLines(children: ElementContent[]): ElementContent[][] {
  const lines: ElementContent[][] = [[]];
  const current = () => lines[lines.length - 1]!;

  const append = (node: ElementContent) => {
    if (node.type === 'text') {
      node.value.split(LINE_BREAK).forEach((part, index) => {
        if (index > 0) lines.push([]);
        if (part) current().push({ type: 'text', value: part });
      });
      return;
    }
    if (node.type === 'element') {
      // Elements spanning line breaks (e.g. a multi-line comment token) are
      // cloned once per covered line so the per-line wrappers nest correctly.
      const segments = splitLines(node.children);
      if (segments.length === 1) {
        current().push(node);
        return;
      }
      segments.forEach((segment, index) => {
        if (index > 0) lines.push([]);
        if (segment.length > 0) current().push({ ...node, children: segment });
      });
      return;
    }
    current().push(node);
  };

  children.forEach(append);
  return lines;
}

/**
 * Wraps each line of highlighted code content in a `span.code-line` element.
 * Line breaks stay as `\n` text nodes between the wrappers so `textContent`,
 * copy, and selection produce the original source unchanged.
 */
export function addLineNumbers(children: ElementContent[]): ElementContent[] {
  const lines = splitLines(children);
  // A source ending in a line break yields one trailing empty segment; drop
  // it so the block does not render a phantom empty numbered line.
  const trailingBreak =
    lines.length > 1 && lines[lines.length - 1]!.length === 0;
  if (trailingBreak) lines.pop();

  const out: ElementContent[] = [];
  lines.forEach((line, index) => {
    if (index > 0) out.push({ type: 'text', value: '\n' });
    out.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['code-line'] },
      children: line,
    });
  });
  if (trailingBreak) out.push({ type: 'text', value: '\n' });
  return out;
}
