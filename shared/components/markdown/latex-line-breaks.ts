const MATH_DELIMITERS = ['$$', '$'];

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

function doubleLineBreaks(source: string) {
  let result = '';

  for (let index = 0; index < source.length;) {
    if (source[index] !== '\\') {
      result += source[index];
      index += 1;
      continue;
    }

    let end = index;
    while (source[end] === '\\') end += 1;
    const count = end - index;
    result += count === 2 ? '\\\\\\\\' : source.slice(index, end);
    index = end;
  }

  return result;
}

export function preserveLatexLineBreaks(source: string) {
  let result = '';
  let index = 0;
  let inFence = false;

  while (index < source.length) {
    if (source.startsWith('```', index) || source.startsWith('~~~', index)) {
      const lineEnd = source.indexOf('\n', index);
      const fenceEnd = lineEnd === -1 ? source.length : lineEnd + 1;
      inFence = !inFence;
      result += source.slice(index, fenceEnd);
      index = fenceEnd;
      continue;
    }

    if (inFence) {
      result += source[index];
      index += 1;
      continue;
    }

    const delimiter = source.startsWith(MATH_DELIMITERS[0], index)
      ? MATH_DELIMITERS[0]
      : source[index] === '$' && !isEscaped(source, index)
        ? MATH_DELIMITERS[1]
        : null;

    if (!delimiter) {
      result += source[index];
      index += 1;
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
    result += doubleLineBreaks(source.slice(contentStart, contentEnd));
    result += delimiter;
    index = contentEnd + delimiter.length;
  }

  return result;
}
