import type { RpcMessage } from './clangd-protocol';

export class ClangdConnection {
  private nextId = 0;
  private disposed = false;
  private pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  readonly ready: Promise<void>;
  private resolveReady!: () => void;
  private rejectReady!: (error: Error) => void;
  private startupTimer: ReturnType<typeof setTimeout>;

  constructor(
    private worker: Worker,
    standard: string,
    private onNotification: (message: RpcMessage) => void,
    private onFailure: () => void
  ) {
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    this.startupTimer = setTimeout(() => this.fail(), 120_000);
    worker.onmessage = (
      event: MessageEvent<{ type: string; message?: RpcMessage }>
    ) => {
      if (this.disposed) return;
      if (event.data.type === 'failed') return this.fail();
      if (event.data.type === 'ready') {
        clearTimeout(this.startupTimer);
        this.resolveReady();
      }
      if (event.data.type !== 'rpc' || !event.data.message) return;
      const message = event.data.message;
      if (message.method && message.id !== undefined) {
        worker.postMessage({
          type: 'rpc',
          message: {
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32601, message: 'Client method not supported' },
          },
        });
      } else if (message.method) {
        this.onNotification(message);
      } else if (typeof message.id === 'number') {
        const request = this.pending.get(message.id);
        if (!request) return;
        clearTimeout(request.timer);
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
      }
    };
    worker.onerror = () => this.fail();
    worker.onmessageerror = () => this.fail();
    worker.postMessage({ type: 'start', standard });
  }

  notify(method: string, params: unknown) {
    if (!this.disposed)
      this.worker.postMessage({
        type: 'rpc',
        message: { jsonrpc: '2.0', method, params },
      });
  }

  request<T>(
    method: string,
    params: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    if (this.disposed || signal?.aborted)
      return Promise.reject(new Error('Request cancelled'));
    const id = ++this.nextId;
    let cancel: (reason: string) => void = () => {};
    let onAbort: () => void = () => {};
    const result = new Promise<unknown>((resolve, reject) => {
      cancel = (reason: string) => {
        const request = this.pending.get(id);
        if (!request) return;
        this.pending.delete(id);
        clearTimeout(request.timer);
        this.notify('$/cancelRequest', { id });
        reject(new Error(reason));
      };
      onAbort = () => cancel('Request cancelled');
      // A slow request is rejected on its own; only worker failures or the
      // startup budget tear the whole connection down.
      this.pending.set(id, {
        resolve,
        reject,
        timer: setTimeout(() => cancel('Request timed out'), 15_000),
      });
      signal?.addEventListener('abort', onAbort, { once: true });
      this.worker.postMessage({
        type: 'rpc',
        message: { jsonrpc: '2.0', id, method, params },
      });
    });
    return result.finally(() =>
      signal?.removeEventListener('abort', onAbort)
    ) as Promise<T>;
  }

  private fail() {
    if (this.disposed) return;
    this.dispose();
    this.onFailure();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    clearTimeout(this.startupTimer);
    this.rejectReady(new Error('Language server stopped'));
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error('Language server stopped'));
    }
    this.pending.clear();
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.onmessageerror = null;
    // Allow the worker to explicitly stop its Emscripten pthread children first.
    this.worker.postMessage({ type: 'stop' });
    setTimeout(() => this.worker.terminate(), 100);
  }
}
