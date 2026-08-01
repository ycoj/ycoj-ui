type ResolveFileUrlsOptions = {
  baseUrl: string;
  filenames: readonly string[];
  query?: Record<string, string | undefined>;
};

const FILE_URL_PATTERN = /file:\/\/([^\s)\\'"<>]+)/g;

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

  return content.replace(FILE_URL_PATTERN, (original, fileInfo: string) => {
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
  });
}
