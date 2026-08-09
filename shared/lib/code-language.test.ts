import { getSyntaxLanguage } from './code-language';
import { describe, expect, it } from 'vitest';

describe('getSyntaxLanguage', () => {
  it('maps language families to their syntax identifiers', () => {
    expect(getSyntaxLanguage('cc')).toBe('cpp');
    expect(getSyntaxLanguage('cc.cc14o2')).toBe('cpp');
    expect(getSyntaxLanguage('pas')).toBe('pascal');
    expect(getSyntaxLanguage('kt')).toBe('kotlin');
    expect(getSyntaxLanguage('kt.jvm')).toBe('kotlin');
    expect(getSyntaxLanguage('py')).toBe('python');
    expect(getSyntaxLanguage('py.py3')).toBe('python');
    expect(getSyntaxLanguage('rs')).toBe('rust');
    expect(getSyntaxLanguage('hs')).toBe('haskell');
    expect(getSyntaxLanguage('js')).toBe('javascript');
    expect(getSyntaxLanguage('rb')).toBe('ruby');
    expect(getSyntaxLanguage('cs')).toBe('csharp');
  });

  it('keeps families whose syntax identifier matches unchanged', () => {
    expect(getSyntaxLanguage('java')).toBe('java');
    expect(getSyntaxLanguage('go')).toBe('go');
    expect(getSyntaxLanguage('php')).toBe('php');
  });

  it('keeps unknown families unchanged', () => {
    expect(getSyntaxLanguage('python')).toBe('python');
    expect(getSyntaxLanguage('python.py311')).toBe('python');
  });

  it('returns an empty string for empty input', () => {
    expect(getSyntaxLanguage('')).toBe('');
  });
});
