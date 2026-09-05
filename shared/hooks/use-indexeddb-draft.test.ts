import { useIndexedDbDraft } from './use-indexeddb-draft';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const load = vi.fn<(id: string) => Promise<Record<string, string> | null>>();
const save =
  vi.fn<(id: string, value: Record<string, string>) => Promise<void>>();
const clear = vi.fn<(id: string) => Promise<void>>();
const sanitize = (stored: Record<string, string>) => stored;

function renderDraft(draftId: string) {
  return renderHook(
    ({ id }: { id: string }) =>
      useIndexedDbDraft(id, {
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

describe('useIndexedDbDraft draft switching', () => {
  it('drops previous answers when the draft id changes', async () => {
    load.mockImplementation(
      async (id: string): Promise<Record<string, string> | null> => {
        if (id === 'd1') return { q1: 'o1' };
        if (id === 'd2') return { q2: 'o2' };
        return null;
      }
    );
    const { result, rerender } = renderDraft('d1');
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({ q1: 'o1' });

    save.mockClear();
    rerender({ id: 'd2' });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({ q2: 'o2' });
    expect(save).not.toHaveBeenCalledWith(
      'd2',
      expect.objectContaining({ q1: 'o1' })
    );
  });

  it('shows empty answers when switching to a draft without stored data', async () => {
    load.mockImplementation(
      async (id: string): Promise<Record<string, string> | null> => {
        if (id === 'd1') return { q1: 'o1' };
        return null;
      }
    );
    const { result, rerender } = renderDraft('d1');
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({ q1: 'o1' });

    save.mockClear();
    rerender({ id: 'd2' });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({});
    expect(save).not.toHaveBeenCalledWith('d2', expect.anything());
  });
});

describe('useIndexedDbDraft empty saves', () => {
  it('does not persist an empty payload after clearing', async () => {
    load.mockResolvedValue({ q1: 'o1' });
    const { result } = renderDraft('d1');
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({ q1: 'o1' });

    save.mockClear();
    await act(async () => {
      await result.current.clearAnswers();
    });
    await waitFor(() => expect(result.current.answers).toEqual({}));
    expect(clear).toHaveBeenCalledWith('d1');
    expect(save).not.toHaveBeenCalledWith('d1', {});
  });

  it('clears a stale payload that sanitizes to empty', async () => {
    load.mockResolvedValue({ q1: 'stale' });
    const sanitizeStale = () => ({});
    const { result } = renderHook(() =>
      useIndexedDbDraft('d1', {
        load,
        save,
        clear,
        sanitize: sanitizeStale,
        isReadOnly: false,
      })
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({});
    await waitFor(() => expect(clear).toHaveBeenCalledWith('d1'));
    expect(save).not.toHaveBeenCalled();
  });

  it('holds persistence until sanitize inputs are ready', async () => {
    load.mockResolvedValue({ q1: 'o1' });
    const sanitizeEmpty = () => ({});
    const sanitizeReady = (stored: Record<string, string>) => stored;
    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) =>
        useIndexedDbDraft('d1', {
          load,
          save,
          clear,
          sanitize: ready ? sanitizeReady : sanitizeEmpty,
          isReadOnly: false,
          isSanitizeReady: ready,
        }),
      { initialProps: { ready: false } }
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.answers).toEqual({});
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(clear).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();

    rerender({ ready: true });
    await waitFor(() => expect(result.current.answers).toEqual({ q1: 'o1' }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(clear).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
