import {
  cloneElement,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

// Circled digits mark blanks to fill in code-completion questions:
// ⓪ (U+24EA) and ①–⑳ (U+2460–U+2473).
const CIRCLED_MARKER_RE = /([\u24EA\u2460-\u2473])/u;

const MARKER_CLASSES = 'font-sans text-[1.4em] leading-none';

function wrapTextMarkers(text: string): ReactNode {
  if (!CIRCLED_MARKER_RE.test(text)) {
    return text;
  }
  // Splitting on the capturing group alternates plain text and the matched
  // marker, so odd parts are the circled digits.
  return text
    .split(CIRCLED_MARKER_RE)
    .map((part, index) =>
      index % 2 === 1
        ? createElement('span', { key: index, className: MARKER_CLASSES }, part)
        : part
    );
}

/**
 * Wraps circled blank markers inside rendered code block children in a
 * sans-serif, enlarged span: monospace CJK fonts draw ①-style digits much
 * smaller than the surrounding code, making the blanks hard to spot. Runs on
 * React nodes so it works after syntax highlighting and line numbering.
 */
export function wrapCircledMarkers(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return wrapTextMarkers(children);
  }
  if (Array.isArray(children)) {
    return children.map((child) => wrapCircledMarkers(child));
  }
  if (isValidElement(children)) {
    const element = children as ReactElement<{ children?: ReactNode }>;
    const nextChildren = wrapCircledMarkers(element.props.children);
    if (nextChildren === element.props.children) {
      return children;
    }
    return cloneElement(element, { children: nextChildren });
  }
  return children;
}
