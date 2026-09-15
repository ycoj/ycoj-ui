import {
  CODE_EDITOR_STORAGE_KEY,
  useCodeEditorPreference,
} from './use-code-editor-preference';
import { act, createElement, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

beforeEach(() => {
  window.localStorage.clear();
});

test('enables the code editor by default', async () => {
  const { result } = await renderHook(() => useCodeEditorPreference());
  expect(result.current[0]).toBe(true);
});

test('reads a stored preference after mount', async () => {
  window.localStorage.setItem(CODE_EDITOR_STORAGE_KEY, '0');
  const { result } = await renderHook(() => useCodeEditorPreference());

  await vi.waitFor(() => {
    expect(result.current[0]).toBe(false);
  });
});

test('does not mount the code editor while hydrating a stored textarea preference', async () => {
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

  expect(container.querySelector('textarea')).not.toBeNull();
  expect(MonacoEditorLoader).not.toHaveBeenCalled();

  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, createElement(PreferenceEditor));
  });

  await vi.waitFor(() => {
    expect(hydratedPreference).toBe(false);
    expect(container.querySelector('textarea')).not.toBeNull();
  });
  expect(MonacoEditorLoader).not.toHaveBeenCalled();

  act(() => root.unmount());
  container.remove();
});

test('persists updates to localStorage', async () => {
  const { result } = await renderHook(() => useCodeEditorPreference());

  act(() => {
    result.current[1](false);
  });

  expect(window.localStorage.getItem(CODE_EDITOR_STORAGE_KEY)).toBe('0');
  expect(result.current[0]).toBe(false);
});
