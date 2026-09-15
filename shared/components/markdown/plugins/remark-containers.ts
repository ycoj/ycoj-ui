import remarkPdf from '@/shared/components/markdown/plugins/remark-pdf';
import remarkProblemSamples from '@/shared/components/markdown/plugins/remark-problem-samples';
import type { Processor } from 'unified';

type MdastNode = {
  type: string;
  children?: MdastNode[];
  data?: Record<string, unknown>;
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
  value?: string;
};

type ParseSource = (source: string) => MdastNode;

type AlignValue = 'center' | 'left' | 'right';
type AlertVariant = 'error' | 'info' | 'success' | 'warning';

const DIRECTIVE_RE =
  /^:::\s*(?:align\s*\{\s*(center|right|left)\s*\}|(info|warning|success|error))\s*(?:\[(.*)\])?\s*$/i;
const CLOSING_RE = /^\s*:::\s*$/;

type ContainerDirective =
  | { align: AlignValue; kind: 'align' }
  | { kind: 'alert'; title: string | null; variant: AlertVariant };

// Built containers are identified by their hName so the final recursion pass
// can tell them apart from plain content that still needs to be scanned.
function isBuiltContainer(node: MdastNode): boolean {
  return node.data?.hName === 'md-alert' || node.data?.hName === 'md-align';
}

function getParagraphText(node: MdastNode): null | string {
  if (node.type !== 'paragraph' || !node.children) return null;
  let value = '';
  for (const child of node.children) {
    if (child.type !== 'text' || typeof child.value !== 'string') return null;
    value += child.value;
  }
  return value;
}

// Returns the raw markdown source of a node, so container bodies containing
// inline markdown (emphasis, links, ...) survive re-parsing. Falls back to the
// plain text for synthetic trees without position info.
function getNodeSource(node: MdastNode, source: string): null | string {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (typeof start === 'number' && typeof end === 'number') {
    return source.slice(start, end);
  }
  return getParagraphText(node);
}

function parseDirective(line: string): ContainerDirective | null {
  const match = DIRECTIVE_RE.exec(line);
  if (!match) return null;

  if (match[1]) {
    // A title only makes sense for alert containers.
    if (match[3] !== undefined) return null;
    return { align: match[1].toLowerCase() as AlignValue, kind: 'align' };
  }

  const title = match[3]?.trim();
  return {
    kind: 'alert',
    title: title ? title : null,
    variant: match[2]!.toLowerCase() as AlertVariant,
  };
}

function makeContainerNode(
  directive: ContainerDirective,
  children: MdastNode[]
): MdastNode {
  if (directive.kind === 'align') {
    return {
      type: 'container',
      children,
      data: {
        hName: 'md-align',
        hProperties: { 'data-align': directive.align },
      },
    };
  }
  return {
    type: 'container',
    children,
    data: {
      hName: 'md-alert',
      hProperties: {
        'data-variant': directive.variant,
        ...(directive.title ? { 'data-title': directive.title } : {}),
      },
    },
  };
}

// Finds the closing line matching the opening directive on lines[0], skipping
// over nested container directives, or -1 when the paragraph holds no match.
function findClosingLine(lines: string[]): number {
  let depth = 1;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (parseDirective(line)) {
      depth += 1;
    } else if (CLOSING_RE.test(line)) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function processChildren(
  children: MdastNode[],
  source: string,
  parseSource: ParseSource
): MdastNode[] {
  const wrapper: MdastNode = { type: 'root', children };
  transformNode(wrapper, source, parseSource);
  return wrapper.children ?? [];
}

// Re-parses a compact container body and applies the same remark transforms
// the outer tree already went through, so all authoring forms behave alike.
function parseInnerChildren(
  body: string,
  parseSource: ParseSource
): MdastNode[] {
  const innerTree = parseSource(body);
  const innerChildren = processChildren(
    innerTree.children ?? [],
    body,
    parseSource
  );
  const wrapper: MdastNode = { type: 'root', children: innerChildren };
  remarkPdf()(wrapper);
  remarkProblemSamples()(wrapper);
  return wrapper.children ?? [];
}

type Frame = {
  collected: MdastNode[];
  directive: ContainerDirective;
  opening: MdastNode;
  // Lines that followed the opening marker inside its own paragraph,
  // re-parsed into nodes. They render inside the opening paragraph, so an
  // unterminated frame drops them on restore instead of double-emitting.
  tail: MdastNode[] | null;
};

function transformNode(
  node: MdastNode,
  source: string,
  parseSource: ParseSource
) {
  const children = node.children;
  if (!children || children.length === 0) return;

  const result: MdastNode[] = [];
  const frames: Frame[] = [];

  const pushContent = (item: MdastNode) => {
    const frame = frames[frames.length - 1];
    if (frame) frame.collected.push(item);
    else result.push(item);
  };

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index]!;
    const text =
      child.type === 'paragraph' ? getNodeSource(child, source) : null;

    if (text !== null && CLOSING_RE.test(text) && frames.length > 0) {
      const frame = frames.pop()!;
      const container = makeContainerNode(frame.directive, [
        ...(frame.tail ?? []),
        ...frame.collected,
      ]);
      transformNode(container, source, parseSource);
      pushContent(container);
      continue;
    }

    const directive =
      text === null ? null : parseDirective(text.split('\n')[0] ?? '');

    if (text === null || directive === null) {
      pushContent(child);
      continue;
    }

    const lines = text.split('\n');
    if (lines.length > 1) {
      const closingLine = findClosingLine(lines);
      if (closingLine === lines.length - 1) {
        const container = makeContainerNode(
          directive,
          parseInnerChildren(
            lines.slice(1, closingLine).join('\n'),
            parseSource
          )
        );
        pushContent(container);
      } else if (closingLine === -1) {
        frames.push({
          directive,
          opening: child,
          collected: [],
          tail: parseInnerChildren(lines.slice(1).join('\n'), parseSource),
        });
      } else {
        // Content after the closing marker: leave the paragraph untouched so
        // no authored content is silently dropped.
        pushContent(child);
      }
      continue;
    }

    frames.push({ directive, opening: child, collected: [], tail: null });
  }

  // Completed containers and plain content are final: scan them for nested
  // containers in deeper levels. Unterminated frames fall back to their
  // original opening paragraph; content collected for them is emitted as-is,
  // so completed inner containers still render.
  for (const item of result) {
    if (isBuiltContainer(item)) continue;
    transformNode(item, source, parseSource);
  }

  for (const frame of frames) {
    result.push(frame.opening, ...frame.collected);
  }

  node.children = result;
}

export default function remarkContainers(this: Processor) {
  return (tree: MdastNode, file: { toString: () => string }) => {
    transformNode(
      tree,
      String(file),
      (source) => this.parse(source) as MdastNode
    );
  };
}
