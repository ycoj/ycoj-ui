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
type ContainerState = 'closed' | 'opened';

const DIRECTIVE_RE =
  /^:::\s*(?:align\s*\{\s*(center|right|left)\s*\}|(info|warning|success|error))\s*(?:\[(.*)\])?\s*(?:\{(opened|closed)\})?\s*$/i;
const CLOSING_RE = /^\s*:::\s*$/;
const BLOCKQUOTE_MARKER_RE = /^[ \t]*(?:>[ \t]?)+/;
const LEADING_WHITESPACE_RE = /^[ \t]*/;

type ContainerDirective =
  | { align: AlignValue; kind: 'align' }
  | {
      kind: 'alert';
      state: ContainerState | null;
      title: string | null;
      variant: AlertVariant;
    };

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

// Paragraph source slices keep the blockquote markers and list indentation of
// their container on continuation lines, so they cannot be parsed as a
// standalone document until those prefixes are removed. Falls back to the
// plain text for synthetic trees without position info.
function getNodeSource(node: MdastNode, source: string): null | string {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (typeof start === 'number' && typeof end === 'number') {
    return normalizeParagraphSource(node, source, source.slice(start, end));
  }
  return getParagraphText(node);
}

// Returns the paragraph source as if it was written at the top level: quote
// markers are stripped and continuation lines are dedented to the paragraph's
// own content column, so compact bodies keep their markdown.
function normalizeParagraphSource(
  node: MdastNode,
  source: string,
  paragraphSource: string
): string {
  const lines = paragraphSource
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(BLOCKQUOTE_MARKER_RE, ''));

  const start = node.position?.start?.offset;
  let structuralIndent = 0;
  if (typeof start === 'number') {
    const lineStart = source.lastIndexOf('\n', start - 1) + 1;
    structuralIndent = source
      .slice(lineStart, start)
      .replace(BLOCKQUOTE_MARKER_RE, '').length;
  }

  // Lazy continuation lines may be indented less than the list marker, so the
  // dedent is clamped to the shallowest continuation line to keep content.
  let dedent = structuralIndent;
  for (let index = 1; index < lines.length; index += 1) {
    const leading = LEADING_WHITESPACE_RE.exec(lines[index]!)?.[0].length ?? 0;
    if (leading < dedent) dedent = leading;
  }

  return lines
    .map((line, index) => (index === 0 ? line : line.slice(dedent)))
    .join('\n');
}

function parseDirective(line: string): ContainerDirective | null {
  const match = DIRECTIVE_RE.exec(line);
  if (!match) return null;

  if (match[1]) {
    // A title and a collapse marker only make sense for alert containers.
    if (match[3] !== undefined || match[4] !== undefined) return null;
    return { align: match[1].toLowerCase() as AlignValue, kind: 'align' };
  }

  const title = match[3]?.trim();
  return {
    kind: 'alert',
    state: match[4] ? (match[4].toLowerCase() as ContainerState) : null,
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
        ...(directive.state ? { 'data-state': directive.state } : {}),
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
      // Collected siblings come from the outer tree and keep outer offsets,
      // while tail nodes were parsed from the opening paragraph slice. Only
      // the collected ones may be scanned again with the outer source.
      const collectedRoot: MdastNode = {
        type: 'root',
        children: frame.collected,
      };
      transformNode(collectedRoot, source, parseSource);
      const container = makeContainerNode(frame.directive, [
        ...(frame.tail ?? []),
        ...(collectedRoot.children ?? []),
      ]);
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
  // original opening paragraph, but their collected content is still scanned
  // so completed inner containers render.
  for (const item of result) {
    if (isBuiltContainer(item)) continue;
    transformNode(item, source, parseSource);
  }

  for (const frame of frames) {
    // Content collected by an unterminated frame was never scanned for nested
    // containers, so complete it before falling back to the literal opening.
    const collectedRoot: MdastNode = {
      type: 'root',
      children: frame.collected,
    };
    transformNode(collectedRoot, source, parseSource);
    result.push(frame.opening, ...(collectedRoot.children ?? []));
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
