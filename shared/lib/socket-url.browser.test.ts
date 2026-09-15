import { createRecordSocketUrl } from './socket-url';
import { afterEach, expect, test } from 'vitest';

const processEnv = (
  globalThis as typeof globalThis & {
    process: { env: Record<string, string | undefined> };
  }
).process.env;

function setBaseUrl(value: string) {
  processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL = value;
}

afterEach(() => {
  document.cookie = 'sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  delete processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL;
});

test('builds an encoded JSON-mode websocket URL', () => {
  setBaseUrl('https://oj.example.com/');
  const href = createRecordSocketUrl('/record-conn', {
    domainId: 'system',
    pid: 1000,
    uidOrName: 'a b/c',
  });

  expect(href).not.toBeNull();
  const url = new URL(href!);
  expect(url.protocol).toBe('wss:');
  expect(url.pathname).toBe('/record-conn');
  expect(url.searchParams.get('domainId')).toBe('system');
  expect(url.searchParams.get('pid')).toBe('1000');
  expect(url.searchParams.get('uidOrName')).toBe('a b/c');
  expect(url.searchParams.get('noTemplate')).toBe('1');
});

test('keeps base subpaths and converts http to ws', () => {
  setBaseUrl('http://localhost:8080/hydro');
  const href = createRecordSocketUrl('/record-detail-conn', {});
  const url = new URL(href!);

  expect(url.protocol).toBe('ws:');
  expect(url.pathname).toBe('/hydro/record-detail-conn');
});

test('adds the sid cookie only for cross-origin connections', () => {
  document.cookie = 'sid=session-token; path=/';

  setBaseUrl(`ws://${window.location.host}/`);
  const sameOrigin = new URL(createRecordSocketUrl('/record-conn', {})!);
  expect(sameOrigin.searchParams.has('sid')).toBe(false);

  setBaseUrl('wss://backend.example.com/');
  const crossOrigin = new URL(createRecordSocketUrl('/record-conn', {})!);
  expect(crossOrigin.searchParams.get('sid')).toBe('session-token');
});

test('serializes booleans and skips empty values', () => {
  setBaseUrl('wss://oj.example.com/');
  const url = new URL(
    createRecordSocketUrl('/record-conn', {
      all: true,
      pretest: false,
      tid: undefined,
      uidOrName: '',
    })!
  );

  expect(url.searchParams.get('all')).toBe('1');
  expect(url.searchParams.get('pretest')).toBe('0');
  expect(url.searchParams.has('tid')).toBe(false);
  expect(url.searchParams.has('uidOrName')).toBe(false);
});

test('returns null for missing, malformed, or unsupported bases', () => {
  setBaseUrl('');
  expect(createRecordSocketUrl('/record-conn', {})).toBeNull();

  setBaseUrl('not a url');
  expect(createRecordSocketUrl('/record-conn', {})).toBeNull();

  setBaseUrl('ftp://oj.example.com/');
  expect(createRecordSocketUrl('/record-conn', {})).toBeNull();
});
