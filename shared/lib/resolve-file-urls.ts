type ResolveFileUrlsOptions = {
  baseUrl: string;
  filenames: readonly string[];
  query?: Record<string, string | undefined>;
};

const FILE_URL_PREFIX = 'file://';

function findFileInfoEnd(content: string, start: number) {
  let parenthesisDepth = 0;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];

    if (/\s|[\\'"<>]/.test(character)) return index;
    if (character === '(') parenthesisDepth += 1;
    if (character === ')') {
      if (parenthesisDepth === 0) return index;
      parenthesisDepth -= 1;
    }
  }

  return content.length;
}

function appendQuery(url: string, query: URLSearchParams) {
  const value = query.toString();
  if (!value) return url;

  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const separator = beforeHash.includes('?')
    ? beforeHash.endsWith('?') || beforeHash.endsWith('&')
      ? ''
      : '&'
    : '?';

  return `${beforeHash}${separator}${value}${hash}`;
}

export function resolveFileUrls(
  content: string,
  { baseUrl, filenames, query = {} }: ResolveFileUrlsOptions
) {
  const allowedFilenames = new Set(filenames);
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) queryParams.set(key, value);
  }

  function resolveFileInfo(fileInfo: string) {
    const original = `${FILE_URL_PREFIX}${fileInfo}`;
    const suffixIndex = fileInfo.search(/[?#]/);
    const encodedFilename =
      suffixIndex === -1 ? fileInfo : fileInfo.slice(0, suffixIndex);

    let filename: string;
    try {
      filename = decodeURIComponent(encodedFilename);
    } catch {
      return original;
    }

    if (!allowedFilenames.has(filename)) return original;

    const resolvedUrl = `${baseUrl.replace(/\/$/, '')}/${fileInfo}`;
    return appendQuery(resolvedUrl, queryParams);
  }

  let result = '';
  let cursor = 0;

  while (cursor < content.length) {
    const prefixIndex = content.indexOf(FILE_URL_PREFIX, cursor);
    if (prefixIndex === -1) {
      result += content.slice(cursor);
      break;
    }

    const fileInfoStart = prefixIndex + FILE_URL_PREFIX.length;
    const fileInfoEnd = findFileInfoEnd(content, fileInfoStart);
    const fileInfo = content.slice(fileInfoStart, fileInfoEnd);

    result += content.slice(cursor, prefixIndex);
    result += fileInfo
      ? resolveFileInfo(fileInfo)
      : content.slice(prefixIndex, fileInfoStart);
    cursor = fileInfoEnd;
  }

  return result;
}
