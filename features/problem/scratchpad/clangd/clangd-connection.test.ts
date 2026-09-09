import { ClangdConnection } from './clangd-connection';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  emit(data: unknown) {
    this.onmessage?.({ data });
  }
}

describe('clangd worker connection', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const worker = new FakeWorker();
    const failed = vi.fn();
    const notification = vi.fn();
    const connection = new ClangdConnection(
      worker as unknown as Worker,
      'gnu++17',
      notification,
      failed
    );
    return { worker, failed, notification, connection };
  }

  it('waits for startup, delivers replies and forwards diagnostics', async () => {
    const { worker, connection, notification } = setup();
    worker.emit({ type: 'ready' });
    await connection.ready;
    const request = connection.request('initialize', {});
    worker.emit({
      type: 'rpc',
      message: { jsonrpc: '2.0', id: 1, result: { capabilities: {} } },
    });
    await expect(request).resolves.toEqual({ capabilities: {} });
    worker.emit({
      type: 'rpc',
      message: {
        method: 'textDocument/publishDiagnostics',
        params: { diagnostics: [] },
      },
    });
    expect(notification).toHaveBeenCalledOnce();
    connection.dispose();
    await vi.advanceTimersByTimeAsync(100);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('cancels obsolete requests and ignores late responses', async () => {
    const { worker, connection } = setup();
    worker.emit({ type: 'ready' });
    await connection.ready;
    const controller = new AbortController();
    const request = connection.request(
      'textDocument/hover',
      {},
      controller.signal
    );
    const rejection = expect(request).rejects.toThrow('cancelled');
    controller.abort();
    await rejection;
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'rpc',
      message: { jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 1 } },
    });
    worker.emit({ type: 'rpc', message: { id: 1, result: 'late' } });
    connection.dispose();
  });
  it('falls back after a startup timeout and terminates the worker', async () => {
    const { worker, connection, failed } = setup();
    const rejection = expect(connection.ready).rejects.toThrow('stopped');
    await vi.advanceTimersByTimeAsync(120_000);
    await rejection;
    expect(failed).toHaveBeenCalledOnce();
    expect(worker.postMessage).toHaveBeenLastCalledWith({ type: 'stop' });
    await vi.advanceTimersByTimeAsync(100);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('rejects pending work on crash and disposes only once', async () => {
    const { worker, connection, failed } = setup();
    worker.emit({ type: 'ready' });
    await connection.ready;
    const request = connection.request('textDocument/completion', {});
    const rejection = expect(request).rejects.toThrow('stopped');
    worker.onerror?.();
    await rejection;
    connection.dispose();
    await vi.advanceTimersByTimeAsync(100);
    expect(failed).toHaveBeenCalledOnce();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('stops an unresponsive server after the handshake or a feature request stalls', async () => {
    const { worker, connection, failed } = setup();
    worker.emit({ type: 'ready' });
    await connection.ready;
    const request = connection.request('initialize', {});
    const rejection = expect(request).rejects.toThrow('stopped');
    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;
    expect(failed).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(100);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
