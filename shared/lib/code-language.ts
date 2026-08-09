// Maps OJ language family keys to syntax language identifiers understood
// by highlighters and editors (e.g. Monaco, starry-night).
const LANGUAGE_ALIASES: Record<string, string> = {
  cc: 'cpp',
  cs: 'csharp',
  hs: 'haskell',
  js: 'javascript',
  kt: 'kotlin',
  pas: 'pascal',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
};

/**
 * Normalizes an OJ language identifier (e.g. "cc.cc14o2") to the syntax
 * language identifier of its family (e.g. "cpp").
 */
export function getSyntaxLanguage(lang: string): string {
  const family = lang.split('.')[0];
  return LANGUAGE_ALIASES[family] ?? family;
}
