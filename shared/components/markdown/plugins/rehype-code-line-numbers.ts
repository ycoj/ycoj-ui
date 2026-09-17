import {
  addLineNumbers,
  LINE_NUMBER_DIGITS_VARIABLE,
  NO_LINE_NUMBERS_SUFFIX,
} from '@/shared/lib/code-line-numbers';
import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

const LANGUAGE_PREFIX = 'language-';

/**
 * Rewrites `language-*|no-line-numbers` classes on `code` elements to the
 * bare language so the highlighter still resolves them, and returns the code
 * elements that opted out of line numbers. Must run after sanitize (which
 * only keeps `language-*` classes) and before highlighting.
 */
export function stripLineNumberFlags(tree: Root): Set<Element> {
  const skipped = new Set<Element>();
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'code') return;
    const className = node.properties.className;
    if (!Array.isArray(className)) return;

    let flagged = false;
    const next = className.flatMap((token) => {
      if (typeof token !== 'string') return [token];
      if (
        !token.startsWith(LANGUAGE_PREFIX) ||
        !token.endsWith(NO_LINE_NUMBERS_SUFFIX)
      ) {
        return [token];
      }
      flagged = true;
      const language = token.slice(
        LANGUAGE_PREFIX.length,
        -NO_LINE_NUMBERS_SUFFIX.length
      );
      return language ? [LANGUAGE_PREFIX + language] : [];
    });
    if (!flagged) return;

    skipped.add(node);
    if (next.length > 0) node.properties.className = next;
    else delete node.properties.className;
  });
  return skipped;
}

/**
 * Wraps every line inside `pre` code blocks in `span.code-line` elements so
 * CSS counters can render line numbers. Flagged code elements are skipped.
 */
export function wrapCodeBlockLines(
  tree: Root,
  skipped: ReadonlySet<Element>
): void {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'pre') return;
    const only = node.children.length === 1 ? node.children[0] : undefined;
    const code =
      only && only.type === 'element' && only.tagName === 'code'
        ? only
        : undefined;
    if (code && skipped.has(code)) return;

    const numbered = addLineNumbers(code ? code.children : node.children);
    if (code) code.children = numbered.children;
    else node.children = numbered.children;
    node.properties.style = `${LINE_NUMBER_DIGITS_VARIABLE}: ${numbered.lineNumberDigits}`;
  });
}

export default function rehypeCodeLineNumbers() {
  return (tree: Root): void => {
    wrapCodeBlockLines(tree, stripLineNumberFlags(tree));
  };
}
