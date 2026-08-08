import { uploadProblemFile } from './files';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('uploadProblemFile', () => {
  afterEach(() => {
    document.cookie = 'sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('uploads directly with the frontend session', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_UPLOAD_BASEURL',
      'https://backend.example.com/root///'
    );
    document.cookie = 'sid=session-token; path=/';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}'));

    const request = uploadProblemFile(
      1000,
      new File(['content'], '1.in'),
      'testdata',
      undefined,
      'contest-id'
    );

    expect(request.url).toBe('https://backend.example.com/root/p/1000/files');
    expect(request.config.params).toEqual({
      tid: 'contest-id',
      sid: 'session-token',
    });

    await request.send();

    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    const parsedUrl = new URL(String(requestUrl));
    expect(parsedUrl.searchParams.get('tid')).toBe('contest-id');
    expect(parsedUrl.searchParams.get('sid')).toBe('session-token');
    expect(requestInit).toEqual(
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
