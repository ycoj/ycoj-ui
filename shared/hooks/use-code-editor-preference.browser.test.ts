import {
  CODE_EDITOR_STORAGE_KEY,
  useCodeEditorPreference,
} from './use-code-editor-preference';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('does not mount the code editor while hydrating a stored textarea preference', async () => {
    let hydratedPreference: boolean | undefined;
    const MonacoEditorLoader = vi.fn(() => {
      return createElement('div', { 'data-testid': 'code-editor' });
    });

    function PreferenceEditor() {
      const [codeEditorEnabled] = useCodeEditorPreference();

      useEffect(() => {
        hydratedPreference = codeEditorEnabled;
      }, [codeEditorEnabled]);

      if (codeEditorEnabled === true) {
        return createElement(MonacoEditorLoader);
      }

      return createElement('textarea', { 'aria-label': 'Code' });
    }

    window.localStorage.setItem(CODE_EDITOR_STORAGE_KEY, '0');
    const container = document.createElement('div');
    container.innerHTML = renderToString(createElement(PreferenceEditor));
    document.body.append(container);

    expect(container.querySelector('textarea')).toBeInTheDocument();
    expect(MonacoEditorLoader).not.toHaveBeenCalled();

    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, createElement(PreferenceEditor));
    });

    await waitFor(() => {
      expect(hydratedPreference).toBe(false);
      expect(container.querySelector('textarea')).toBeInTheDocument();
    });
    expect(MonacoEditorLoader).not.toHaveBeenCalled();

    act(() => root.unmount());
    container.remove();
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
