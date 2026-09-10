import { pollHtmlToMarkdown, submitHtmlToMarkdown } from './html-to-markdown';
import { describe, expect, it } from 'vitest';

describe('submitHtmlToMarkdown', () => {
  it('posts to the dedicated html-to-markdown route with a profile id', () => {
    const request = submitHtmlToMarkdown('P1000', 'quality');

    expect(request.url).toBe('/p/P1000/html-to-markdown');
    expect(request.data).toEqual({ profileId: 'quality' });
  });

  it('sends an empty body when no profile id is given', () => {
    const request = submitHtmlToMarkdown('P1000');

    expect(request.url).toBe('/p/P1000/html-to-markdown');
    expect(request.data).toEqual({});
  });
});

describe('pollHtmlToMarkdown', () => {
  it('polls the job route without caching responses', () => {
    const request = pollHtmlToMarkdown('P1000', 'job-123');

    expect(request.url).toBe('/p/P1000/html-to-markdown/job-123');
    expect(request.config.cacheFor).toBe(0);
  });
});
