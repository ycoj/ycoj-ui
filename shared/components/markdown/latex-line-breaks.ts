const MATH_DELIMITERS = ['$$', '$'];

type Fence = {
  marker: '`' | '~';
  length: number;
};

function getLineEnd(source: string, lineStart: number) {
  const newline = source.indexOf('\n', lineStart);
  return newline === -1 ? source.length : newline + 1;
}

function getLineContent(source: string, lineStart: number, lineEnd: number) {
  const contentEnd = source[lineEnd - 1] === '\n' ? lineEnd - 1 : lineEnd;
  const carriageReturnEnd =
    source[contentEnd - 1] === '\r' ? contentEnd - 1 : contentEnd;

  return source.slice(lineStart, carriageReturnEnd);
}

function getOpeningFence(line: string): Fence | null {
  const match = /^(?: {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) return null;

  const run = match[1];
  if (run[0] === '`' && match[2].includes('`')) return null;

  return {
    marker: run[0] as Fence['marker'],
    length: run.length,
  };
}

function isClosingFence(line: string, fence: Fence) {
  const match = /^(?: {0,3})(`+|~+)[ \t]*$/.exec(line);
  return match?.[1][0] === fence.marker && match[1].length >= fence.length;
}

function getFencedCodeEnd(source: string, lineStart: number) {
  const openingLineEnd = getLineEnd(source, lineStart);
  const fence = getOpeningFence(
    getLineContent(source, lineStart, openingLineEnd)
  );
  if (!fence) return null;

  let lineStartCursor = openingLineEnd;
  while (lineStartCursor < source.length) {
    const lineEnd = getLineEnd(source, lineStartCursor);
    if (
      isClosingFence(getLineContent(source, lineStartCursor, lineEnd), fence)
    ) {
      return lineEnd;
    }
    lineStartCursor = lineEnd;
  }

  return source.length;
}

function getCodeSpanEnd(source: string, openingStart: number) {
  let openingEnd = openingStart;
  while (source[openingEnd] === '`') openingEnd += 1;
  const openingLength = openingEnd - openingStart;
  let cursor = openingEnd;

  while (cursor < source.length) {
    const closingStart = source.indexOf('`', cursor);
    if (closingStart === -1) return null;

    let closingEnd = closingStart;
    while (source[closingEnd] === '`') closingEnd += 1;
    if (closingEnd - closingStart === openingLength) return closingEnd;
    cursor = closingEnd;
  }

  return null;
}

function isEscaped(source: string, index: number) {
  let backslashes = 0;

  for (
    let cursor = index - 1;
    cursor >= 0 && source[cursor] === '\\';
    cursor -= 1
  ) {
    backslashes += 1;
  }

  return backslashes % 2 === 1;
}

const MARKDOWN_ACTIVE_CHARACTERS = new Set(['*', '<', '_', '~']);

function escapeLatexForMarkdown(content: string) {
  let result = '';

  for (let index = 0; index < content.length;) {
    const char = content[index];

    if (char === '\\') {
      let end = index;
      while (content[end] === '\\') end += 1;
      // Markdown consumes one level of backslash escapes, so double every
      // run: N backslashes survive as N literal backslashes for KaTeX.
      result += '\\'.repeat((end - index) * 2);
      index = end;
      continue;
    }

    // `*`, `<`, `_`, and `~` would otherwise be consumed by markdown
    // (emphasis, strikethrough, raw HTML) before KaTeX runs. A markdown
    // escape renders as the bare character, so the text KaTeX sees stays
    // identical to the LaTeX source.
    result += MARKDOWN_ACTIVE_CHARACTERS.has(char) ? `\\${char}` : char;
    index += 1;
  }

  return result;
}

export function preserveLatexLineBreaks(source: string) {
  let result = '';
  let index = 0;

  while (index < source.length) {
    const isLineStart = index === 0 || source[index - 1] === '\n';
    if (isLineStart) {
      const lineEnd = getLineEnd(source, index);
      const fencedCodeEnd = getFencedCodeEnd(source, index);
      if (fencedCodeEnd !== null) {
        result += source.slice(index, fencedCodeEnd);
        index = fencedCodeEnd;
        continue;
      }

      const line = getLineContent(source, index, lineEnd);
      if (/^(?: {4}|\t)/.test(line)) {
        result += source.slice(index, lineEnd);
        index = lineEnd;
        continue;
      }
    }

    if (source[index] === '`' && !isEscaped(source, index)) {
      const codeSpanEnd = getCodeSpanEnd(source, index);
      if (codeSpanEnd !== null) {
        result += source.slice(index, codeSpanEnd);
        index = codeSpanEnd;
        continue;
      }
    }

    const hasDisplayDelimiter = source.startsWith(MATH_DELIMITERS[0], index);
    const displayDelimiterIsEscaped =
      hasDisplayDelimiter && isEscaped(source, index);
    const delimiter =
      hasDisplayDelimiter && !displayDelimiterIsEscaped
        ? MATH_DELIMITERS[0]
        : source[index] === '$' && !isEscaped(source, index)
          ? MATH_DELIMITERS[1]
          : null;

    if (!delimiter) {
      const literalLength = displayDelimiterIsEscaped
        ? MATH_DELIMITERS[0].length
        : 1;
      result += source.slice(index, index + literalLength);
      index += literalLength;
      continue;
    }

    const contentStart = index + delimiter.length;
    let contentEnd = contentStart;
    while (contentEnd < source.length) {
      if (
        source.startsWith(delimiter, contentEnd) &&
        !isEscaped(source, contentEnd)
      ) {
        break;
      }
      contentEnd += 1;
    }

    if (contentEnd === source.length) {
      result += source[index];
      index += 1;
      continue;
    }

    result += delimiter;
    result += escapeLatexForMarkdown(source.slice(contentStart, contentEnd));
    result += delimiter;
    index = contentEnd + delimiter.length;
  }

  return result;
}
