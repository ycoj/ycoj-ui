import type {
  Element,
  ElementContent,
  Properties,
  Root,
  RootContent,
  Text,
} from 'hast';

const INLINE_RE =
  /\{\{ (input|textarea|dropdown)\((\d+(?:-\d+)?)\)(?:\[([^\]]*)\])? \}\}/g;
const SELECT_RE = /\{\{ (select|multiselect)\((\d+(?:-\d+)?)\) \}\}/;

type HastParent = Root | Element;
type HastChild = RootContent | ElementContent;

function isText(node: HastChild | HastParent): node is Text {
  return node.type === 'text';
}

function isElement(node: HastChild | HastParent): node is Element {
  return node.type === 'element';
}

function findNextUl(parent: HastParent, from: number): number | null {
  for (let i = from; i < parent.children.length; i += 1) {
    const child = parent.children[i];
    if (!child) continue;
    if (isText(child) && /^\s*$/.test(child.value)) continue;
    if (isElement(child) && child.tagName === 'ul') return i;
    return null;
  }
  return null;
}

function textOf(node: HastChild | HastParent): string {
  if (isText(node)) return node.value;
  if (node.type === 'element' || node.type === 'root') {
    return node.children.map((c) => textOf(c)).join('');
  }
  return '';
}

function elem(
  tagName: string,
  properties: Properties,
  children: ElementContent[]
): Element {
  return {
    type: 'element',
    tagName,
    properties,
    children,
  };
}

function stripFirstOccurrence(node: Text | Element, token: string): boolean {
  if (isText(node)) {
    const idx = node.value.indexOf(token);
    if (idx === -1) return false;
    node.value =
      node.value.slice(0, idx) + node.value.slice(idx + token.length);
    return true;
  }
  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];
    if (isText(child)) {
      const idx = child.value.indexOf(token);
      if (idx !== -1) {
        const before = child.value.slice(0, idx);
        const after = child.value.slice(idx + token.length);
        const replacement: Text[] = [];
        if (before) replacement.push({ type: 'text', value: before });
        if (after) replacement.push({ type: 'text', value: after });
        node.children.splice(i, 1, ...replacement);
        return true;
      }
    } else if (
      isElement(child) &&
      child.tagName !== 'code' &&
      child.tagName !== 'pre'
    ) {
      if (stripFirstOccurrence(child, token)) return true;
    }
  }
  return false;
}

function splitInline(node: Text): Array<Text | Element> {
  const matches = [...node.value.matchAll(INLINE_RE)];
  if (matches.length === 0) return [node];
  const out: Array<Text | Element> = [];
  let cur = 0;
  const text = node.value;
  for (const m of matches) {
    const idx = m.index!;
    if (idx > cur) out.push({ type: 'text', value: text.slice(cur, idx) });
    const kind = m[1] as string;
    const id = m[2] as string;
    const raw = m[3] as string | undefined;
    if (kind === 'input') {
      out.push(elem('objective-input', { 'data-id': id }, []));
    } else if (kind === 'textarea') {
      out.push(elem('objective-textarea', { 'data-id': id }, []));
    } else {
      const opts = (raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      out.push(
        elem(
          'objective-dropdown',
          { 'data-id': id, 'data-options': JSON.stringify(opts) },
          opts.map((o) =>
            elem('objective-option', { 'data-value': o }, [
              { type: 'text', value: o },
            ])
          )
        )
      );
    }
    cur = idx + m[0].length;
  }
  if (cur < text.length) out.push({ type: 'text', value: text.slice(cur) });
  return out;
}

function buildChoice(
  kind: 'select' | 'multiselect',
  id: string,
  ul: Element
): Element {
  const items = (ul.children ?? []).filter(
    (c): c is Element => isElement(c) && c.tagName === 'li'
  );
  const targetTag =
    kind === 'select' ? 'objective-select' : 'objective-multiselect';
  return elem(
    targetTag,
    { 'data-id': id },
    items.map((li, idx) =>
      elem(
        'objective-option',
        { 'data-value': String.fromCharCode(65 + idx) },
        li.children ? [...li.children] : []
      )
    )
  );
}

function walk(parent: HastParent): void {
  for (let i = 0; i < parent.children.length; i += 1) {
    const child = parent.children[i];
    if (!child) continue;
    // Skip comments, doctypes and raw nodes; only text and elements qualify.
    if (!isText(child) && !isElement(child)) continue;
    if (isElement(child)) {
      if (child.tagName === 'code' || child.tagName === 'pre') continue;
      if (child.tagName.startsWith('objective-')) continue;
      // Directives are only recognized in direct text or paragraph children.
      // Other containers (blockquote, lists, …) are recursed into so their
      // children are matched only against siblings under the same parent.
      if (child.tagName !== 'p') {
        walk(child);
        continue;
      }
    }

    const txt = isText(child) ? child.value : textOf(child);
    const sel = txt.match(SELECT_RE);
    if (sel) {
      const next = findNextUl(parent, i + 1);
      // stripFirstOccurrence fails when the token only appears inside
      // code/pre descendants — then the directive is not eligible.
      if (next !== null && stripFirstOccurrence(child, sel[0])) {
        const ulNode = parent.children[next];
        if (ulNode && isElement(ulNode)) {
          const target = buildChoice(
            sel[1] as 'select' | 'multiselect',
            sel[2] as string,
            ulNode
          );
          const empty = isText(child)
            ? !child.value.trim()
            : !textOf(child).trim();
          if (empty) {
            parent.children.splice(i, 1);
            const s = findNextUl(parent, i);
            if (s !== null) parent.children[s] = target;
            i -= 1;
            continue;
          }
          parent.children[next] = target;
        }
      }
    }

    if (isText(child)) {
      const parts = splitInline(child);
      if (parts.length !== 1 || parts[0] !== child) {
        parent.children.splice(i, 1, ...parts);
        i += parts.length - 1;
      }
      continue;
    }
    walk(child);
  }
}

export default function rehypeObjective() {
  return (tree: Root): void => {
    walk(tree);
  };
}
