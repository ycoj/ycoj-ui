import { useIndexedDbDraft } from './use-indexeddb-draft';
import { act } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

const load = vi.fn<(id: string) => Promise<Record<string, string> | null>>();
const save =
  vi.fn<(id: string, value: Record<string, string>) => Promise<void>>();
const clear = vi.fn<(id: string) => Promise<void>>();
const sanitize = (stored: Record<string, string>) => stored;

function renderDraft(draftId: string) {
  return renderHook(
    (props?: { id: string }) =>
      useIndexedDbDraft(props!.id, {
        load,
        save,
        clear,
        sanitize,
        isReadOnly: false,
      }),
    { initialProps: { id: draftId } }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('indexedDB', {});
  load.mockResolvedValue(null);
  save.mockResolvedValue(undefined);
  clear.mockResolvedValue(undefined);
});

test('drops previous answers when the draft id changes', async () => {
  load.mockImplementation(
    async (id: string): Promise<Record<string, string> | null> => {
      if (id === 'd1') return { q1: 'o1' };
      if (id === 'd2') return { q2: 'o2' };
      return null;
    }
  );
  const { result, rerender } = await renderDraft('d1');
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({ q1: 'o1' });

  save.mockClear();
  await rerender({ id: 'd2' });
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({ q2: 'o2' });
  expect(save).not.toHaveBeenCalledWith(
    'd2',
    expect.objectContaining({ q1: 'o1' })
  );
});

test('shows empty answers when switching to a draft without stored data', async () => {
  load.mockImplementation(
    async (id: string): Promise<Record<string, string> | null> => {
      if (id === 'd1') return { q1: 'o1' };
      return null;
    }
  );
  const { result, rerender } = await renderDraft('d1');
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({ q1: 'o1' });

  save.mockClear();
  await rerender({ id: 'd2' });
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({});
  expect(save).not.toHaveBeenCalledWith('d2', expect.anything());
});

test('does not save when sanitize returns a fresh-but-equal object', async () => {
  load.mockResolvedValue({ q1: 'o1' });
  const freshSanitize = (stored: Record<string, string>) => ({ ...stored });
  const { result } = await renderHook(() =>
    useIndexedDbDraft('d1', {
      load,
      save,
      clear,
      sanitize: freshSanitize,
      isReadOnly: false,
    })
  );
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({ q1: 'o1' });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(save).not.toHaveBeenCalled();
  expect(clear).not.toHaveBeenCalled();

  await act(async () => {
    result.current.setAnswer('q2', 'o2');
  });
  await vi.waitFor(() =>
    expect(save).toHaveBeenCalledWith('d1', { q1: 'o1', q2: 'o2' })
  );
});

test('does not persist an empty payload after clearing', async () => {
  load.mockResolvedValue({ q1: 'o1' });
  const { result } = await renderDraft('d1');
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({ q1: 'o1' });

  save.mockClear();
  await act(async () => {
    await result.current.clearAnswers();
  });
  await vi.waitFor(() => expect(result.current.answers).toEqual({}));
  expect(clear).toHaveBeenCalledWith('d1');
  expect(save).not.toHaveBeenCalledWith('d1', {});
});

test('clears a stale payload that sanitizes to empty', async () => {
  load.mockResolvedValue({ q1: 'stale' });
  const sanitizeStale = () => ({});
  const { result } = await renderHook(() =>
    useIndexedDbDraft('d1', {
      load,
      save,
      clear,
      sanitize: sanitizeStale,
      isReadOnly: false,
    })
  );
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({});
  await vi.waitFor(() => expect(clear).toHaveBeenCalledWith('d1'));
  expect(save).not.toHaveBeenCalled();
});

test('holds persistence until sanitize inputs are ready', async () => {
  load.mockResolvedValue({ q1: 'o1' });
  const sanitizeEmpty = () => ({});
  const sanitizeReady = (stored: Record<string, string>) => stored;
  const { result, rerender } = await renderHook(
    (props?: { ready: boolean }) =>
      useIndexedDbDraft('d1', {
        load,
        save,
        clear,
        sanitize: props!.ready ? sanitizeReady : sanitizeEmpty,
        isReadOnly: false,
        isSanitizeReady: props!.ready,
      }),
    { initialProps: { ready: false } }
  );
  await vi.waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.answers).toEqual({});
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(clear).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();

  await rerender({ ready: true });
  await vi.waitFor(() => expect(result.current.answers).toEqual({ q1: 'o1' }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(clear).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});
