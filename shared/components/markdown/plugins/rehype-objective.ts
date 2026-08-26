type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

type HastParent = {
  type: string;
  children: HastNode[];
  tagName?: string;
};

const INLINE_RE =
  /\{\{ (input|textarea|dropdown)\((\d+(?:-\d+)?)\)(?:\[([^\]]*)\])? \}\}/g;
const SELECT_RE = /\{\{ (select|multiselect)\((\d+(?:-\d+)?)\) \}\}/g;

function isCodeTag(tag?: string) {
  return tag === 'code' || tag === 'pre';
}

function isWhitespaceTextNode(node: HastNode): boolean {
  return node.type === 'text' && /^\s*$/.test(node.value ?? '');
}

function findNextUlIndex(parent: HastParent, fromIdx: number): number | null {
  for (let j = fromIdx; j < parent.children.length; j += 1) {
    const n = parent.children[j] as HastNode;
    if (n.type === 'text' && isWhitespaceTextNode(n)) continue;
    if (n.type === 'element' && n.tagName === 'ul') return j;
    return null;
  }
  return null;
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'element' && node.children) {
    return node.children.map(getTextContent).join('');
  }
  return '';
}

function createObjectiveInput(id: string): HastNode {
  return {
    type: 'element',
    tagName: 'objective-input',
    properties: { 'data-id': id },
    children: [],
  };
}

function createObjectiveTextarea(id: string): HastNode {
  return {
    type: 'element',
    tagName: 'objective-textarea',
    properties: { 'data-id': id },
    children: [],
  };
}

function createObjectiveDropdown(id: string, optionsRaw?: string): HastNode {
  const raw = optionsRaw ?? '';
  const options = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const children: HastNode[] = options.map((opt) => ({
    type: 'element',
    tagName: 'objective-option',
    properties: { 'data-value': opt },
    children: [{ type: 'text', value: opt }],
  }));
  return {
    type: 'element',
    tagName: 'objective-dropdown',
    properties: {
      'data-id': id,
      'data-options': JSON.stringify(options),
    },
    children,
  };
}

function createObjectiveSelect(
  id: string,
  type: 'select' | 'multiselect',
  ulNode: HastNode
): HastNode {
  const tagName =
    type === 'select' ? 'objective-select' : 'objective-multiselect';
  const liChildren = (ulNode.children ?? []).filter(
    (c) => c.type === 'element' && c.tagName === 'li'
  );
  const options: HastNode[] = liChildren.map((li, idx) => {
    const value = String.fromCharCode(65 + idx);
    const labelChildren = li.children ? [...li.children] : [];
    return {
      type: 'element',
      tagName: 'objective-option',
      properties: { 'data-value': value },
      children: labelChildren,
    };
  });
  return {
    type: 'element',
    tagName,
    properties: { 'data-id': id },
    children: options,
  };
}

function splitTextNodeWithInlineDirectives(textNode: HastNode): HastNode[] {
  const text = textNode.value ?? '';
  const result: HastNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    const full = match[0];
    const type = match[1] as string;
    const id = match[2] as string;
    const optionsRaw = match[3] as string | undefined;
    const index = match.index;
    if (index > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, index) });
    }
    if (type === 'input') result.push(createObjectiveInput(id));
    else if (type === 'textarea') result.push(createObjectiveTextarea(id));
    else if (type === 'dropdown')
      result.push(createObjectiveDropdown(id, optionsRaw));
    lastIndex = index + full.length;
  }
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) });
  }
  if (result.length === 0) return [textNode];
  if (
    result.length === 1 &&
    result[0].type === 'text' &&
    result[0].value === text
  ) {
    return [textNode];
  }
  return result;
}

function transformInlineInElement(element: HastNode) {
  if (!element.children) return;
  const newChildren: HastNode[] = [];
  for (const child of element.children) {
    if (child.type === 'text') {
      const splitted = splitTextNodeWithInlineDirectives(child);
      const hasElement = splitted.some((n) => n.type === 'element');
      if (hasElement) {
        newChildren.push(...splitted);
      } else {
        newChildren.push(child);
      }
    } else if (child.type === 'element' && !isCodeTag(child.tagName)) {
      transformInlineInElement(child);
      newChildren.push(child);
    } else {
      newChildren.push(child);
    }
  }
  element.children = newChildren;
}

function findFirstSelectDirective(text: string): RegExpExecArray | null {
  SELECT_RE.lastIndex = 0;
  return SELECT_RE.exec(text);
}

export default function rehypeObjective() {
  return (tree: HastParent) => {
    function processParent(parent: HastParent) {
      if (!parent.children) return;
      for (let i = 0; i < parent.children.length; i += 1) {
        const child = parent.children[i] as HastNode;
        if (child.type === 'element' && isCodeTag(child.tagName)) continue;

        let childText = '';
        if (child.type === 'text') childText = child.value ?? '';
        else if (child.type === 'element') childText = getTextContent(child);
        const match = findFirstSelectDirective(childText);
        if (match) {
          const nextIdx = findNextUlIndex(parent, i + 1);
          if (nextIdx !== null) {
            const type = match[1] as 'select' | 'multiselect';
            const id = match[2] as string;
            const full = match[0];
            const next = parent.children[nextIdx] as HastNode;

            if (child.type === 'text') {
              const idx = (child.value ?? '').indexOf(full);
              if (idx !== -1) {
                const before = (child.value ?? '').slice(0, idx);
                const after = (child.value ?? '').slice(idx + full.length);
                const newVal = before + after;
                if (newVal.trim() === '') {
                  parent.children.splice(i, 1);
                  const newNextIdx = findNextUlIndex(parent, i);
                  if (newNextIdx !== null) {
                    const targetNode = parent.children[newNextIdx] as HastNode;
                    const transformed = createObjectiveSelect(
                      id,
                      type,
                      targetNode
                    );
                    parent.children[newNextIdx] = transformed;
                  }
                  i -= 1;
                  continue;
                } else {
                  child.value = newVal;
                  const transformed = createObjectiveSelect(id, type, next);
                  parent.children[nextIdx] = transformed;
                  continue;
                }
              }
            } else if (child.type === 'element') {
              let directiveRemoved = false;
              function removeDirectiveFromElement(el: HastNode) {
                if (!el.children || directiveRemoved) return;
                const newChildren: HastNode[] = [];
                for (const c of el.children) {
                  if (directiveRemoved) {
                    newChildren.push(c);
                    continue;
                  }
                  if (c.type === 'text' && c.value && c.value.includes(full)) {
                    const idx = c.value.indexOf(full);
                    const before = c.value.slice(0, idx);
                    const after = c.value.slice(idx + full.length);
                    if (before)
                      newChildren.push({ type: 'text', value: before });
                    if (after) newChildren.push({ type: 'text', value: after });
                    directiveRemoved = true;
                  } else if (c.type === 'element' && !isCodeTag(c.tagName)) {
                    removeDirectiveFromElement(c);
                    newChildren.push(c);
                  } else {
                    newChildren.push(c);
                  }
                }
                el.children = newChildren;
              }
              removeDirectiveFromElement(child);
              const remainingText = getTextContent(child).trim();
              const isEmptyParagraph =
                child.tagName === 'p' && remainingText === '';
              if (isEmptyParagraph) {
                parent.children.splice(i, 1);
                const newNextIdx = findNextUlIndex(parent, i);
                if (newNextIdx !== null) {
                  const newNext = parent.children[newNextIdx] as HastNode;
                  const transformed = createObjectiveSelect(id, type, newNext);
                  parent.children[newNextIdx] = transformed;
                }
                i -= 1;
                continue;
              } else {
                const transformed = createObjectiveSelect(id, type, next);
                parent.children[nextIdx] = transformed;
              }
            }
          }
        }

        if (
          child.type === 'element' &&
          child.children &&
          !isCodeTag(child.tagName) &&
          child.tagName !== 'ul' &&
          child.tagName !== 'objective-select' &&
          child.tagName !== 'objective-multiselect' &&
          child.tagName !== 'objective-dropdown' &&
          child.tagName !== 'objective-input' &&
          child.tagName !== 'objective-textarea' &&
          child.tagName !== 'objective-option'
        ) {
          if (child.children.length > 0) {
            processParent(child as unknown as HastParent);
          }
        }
      }
    }

    processParent(tree);

    function processInline(parent: HastParent) {
      if (!parent.children) return;
      for (const child of parent.children) {
        if (child.type === 'element') {
          if (isCodeTag(child.tagName)) continue;
          if (
            child.tagName === 'objective-select' ||
            child.tagName === 'objective-multiselect' ||
            child.tagName === 'objective-dropdown' ||
            child.tagName === 'objective-input' ||
            child.tagName === 'objective-textarea' ||
            child.tagName === 'objective-option'
          ) {
            continue;
          }
          transformInlineInElement(child);
          if (child.children) {
            processInline(child as unknown as HastParent);
          }
        }
      }
    }

    processInline(tree);
  };
}
