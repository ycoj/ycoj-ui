import { getAvailableLanguages } from './languages';
import { describe, expect, it } from 'vitest';

describe('getAvailableLanguages', () => {
  it('requests every available language', () => {
    const request = getAvailableLanguages();

    expect(request.url).toBe('/ui/languages');
    expect(request.config.params).toEqual({ pid: undefined });
  });

  it('forwards an optional problem id', () => {
    const request = getAvailableLanguages(1000);

    expect(request.config.params).toEqual({ pid: 1000 });
  });
});
