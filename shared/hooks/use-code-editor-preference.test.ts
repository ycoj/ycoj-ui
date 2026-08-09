import {
  CODE_EDITOR_STORAGE_KEY,
  useCodeEditorPreference,
} from './use-code-editor-preference';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
});

describe('useCodeEditorPreference', () => {
  it('enables the code editor by default', () => {
    const { result } = renderHook(() => useCodeEditorPreference());
    expect(result.current[0]).toBe(true);
  });

  it('reads a stored preference after mount', async () => {
    window.localStorage.setItem(CODE_EDITOR_STORAGE_KEY, '0');
    const { result } = renderHook(() => useCodeEditorPreference());

    await waitFor(() => {
      expect(result.current[0]).toBe(false);
    });
  });

  it('persists updates to localStorage', async () => {
    const { result } = renderHook(() => useCodeEditorPreference());

    act(() => {
      result.current[1](false);
    });

    expect(window.localStorage.getItem(CODE_EDITOR_STORAGE_KEY)).toBe('0');
    expect(result.current[0]).toBe(false);
  });
});
