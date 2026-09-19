import {
  addLineNumbers,
  isCommonCodeLanguage,
  LINE_NUMBER_DIGITS_VARIABLE,
  parseCodeLanguage,
} from '@/shared/lib/code-line-numbers';
import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

const LANGUAGE_PREFIX = 'language-';

/**
 * Rewrites `language-*|line-numbers` and `language-*|no-line-numbers` classes
 * on `code` elements to the bare language so the highlighter still resolves
 * them, and returns the code elements that must not render line numbers:
 * those flagged off, and unflagged ones whose language is not a common code
 * language. Must run after sanitize (which only keeps `language-*` classes)
 * and before highlighting.
 */
export function resolveLineNumberSkips(tree: Root): Set<Element> {
  const skipped = new Set<Element>();
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'code') return;
    const className = node.properties.className;
    if (!Array.isArray(className)) {
      // Fenced blocks without a language carry no class at all.
      skipped.add(node);
      return;
    }

    let flagged = false;
    let hasLanguage = false;
    const next = className.flatMap((token) => {
      if (typeof token !== 'string' || !token.startsWith(LANGUAGE_PREFIX)) {
        return [token];
      }
      hasLanguage = true;
      const { language, lineNumbers } = parseCodeLanguage(
        token.slice(LANGUAGE_PREFIX.length)
      );
      if (lineNumbers === undefined) {
        if (!isCommonCodeLanguage(language)) skipped.add(node);
        return [token];
      }
      flagged = true;
      if (!lineNumbers) skipped.add(node);
      return language ? [LANGUAGE_PREFIX + language] : [];
    });
    if (!hasLanguage) {
      skipped.add(node);
      return;
    }
    if (!flagged) return;

    if (next.length > 0) node.properties.className = next;
    else delete node.properties.className;
  });
  return skipped;
}

/**
 * Wraps every line inside `pre` code blocks in `span.code-line` elements so
 * CSS counters can render line numbers. Resolved skips are left untouched.
 */
export function wrapCodeBlockLines(
  tree: Root,
  skipped: ReadonlySet<Element>
): void {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'pre') return;
    const codes = node.children.filter(
      (child): child is Element =>
        child.type === 'element' && child.tagName === 'code'
    );
    // A `pre` without a `code` child carries no language to decide on.
    if (codes.length === 0) return;
    if (codes.some((code) => skipped.has(code))) return;
    const code = node.children.length === 1 ? codes[0] : undefined;

    const numbered = addLineNumbers(code ? code.children : node.children);
    if (code) code.children = numbered.children;
    else node.children = numbered.children;
    node.properties.style = `${LINE_NUMBER_DIGITS_VARIABLE}: ${numbered.lineNumberDigits}`;
  });
}

export default function rehypeCodeLineNumbers() {
  return (tree: Root): void => {
    wrapCodeBlockLines(tree, resolveLineNumberSkips(tree));
  };
}
