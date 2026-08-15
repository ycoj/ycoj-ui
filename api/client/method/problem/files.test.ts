import {
  getProblemFileDownloadUrl,
  refreshProblemTestdata,
  uploadProblemConfig,
  uploadProblemFile,
} from './files';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = () => void;

class XMLHttpRequestMock {
  static instances: XMLHttpRequestMock[] = [];

  readonly listeners = new Map<string, Listener>();
  readonly headers = new Map<string, string>();
  readonly uploadListeners = new Map<string, Listener>();
  readonly upload = {
    addEventListener: (type: string, listener: Listener) =>
      this.uploadListeners.set(type, listener),
  };
  responseText = '{}';
  status = 200;
  statusText = 'OK';
  timeout = 0;
  withCredentials = false;
  url = '';
  body: Document | XMLHttpRequestBodyInit | null = null;

  constructor() {
    XMLHttpRequestMock.instances.push(this);
  }

  open(_method: string, url: string) {
    this.url = url;
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, listener);
  }

  setRequestHeader(name: string, value: string) {
    this.headers.set(name, value);
  }

  getAllResponseHeaders() {
    return 'content-type: application/json';
  }

  send(body: Document | XMLHttpRequestBodyInit | null) {
    this.body = body;
    queueMicrotask(() => this.listeners.get('load')?.());
  }

  abort() {}

  overrideMimeType() {}
}

describe('uploadProblemFile', () => {
  beforeEach(() => {
    XMLHttpRequestMock.instances = [];
    vi.stubGlobal('XMLHttpRequest', XMLHttpRequestMock);
  });

  afterEach(() => {
    document.cookie = 'sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uploads directly with the frontend session', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_UPLOAD_BASEURL',
      'https://backend.example.com/root///'
    );
    document.cookie = 'sid=session-token; path=/';
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

    const xhr = XMLHttpRequestMock.instances[0];
    const parsedUrl = new URL(xhr.url);
    expect(parsedUrl.searchParams.get('tid')).toBe('contest-id');
    expect(parsedUrl.searchParams.get('sid')).toBe('session-token');
    expect(xhr.withCredentials).toBe(true);
    expect(xhr.headers.get('Accept')).toBe('application/json');
    expect(xhr.body).toBeInstanceOf(FormData);
  });

  it('constructs config.yaml as a testdata upload', async () => {
    const request = uploadProblemConfig(1000, 'type: default\n');
    await request.send();
    const body = XMLHttpRequestMock.instances[0].body as FormData;
    expect(body.get('operation')).toBe('upload_file');
    expect(body.get('type')).toBe('testdata');
    expect(body.get('filename')).toBe('config.yaml');
    const file = body.get('file');
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe('config.yaml');
  });

  it('refreshes file lists and resolves direct download URLs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            testdata: [
              { _id: '1', name: '1.in', size: 1, etag: 'e', lastModified: '' },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ links: { '1.in': 'https://files/1.in' } }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshProblemTestdata(1000)).resolves.toEqual([
      expect.objectContaining({ name: '1.in' }),
    ]);
    await expect(getProblemFileDownloadUrl(1000, '1.in')).resolves.toBe(
      'https://files/1.in'
    );
  });
});
