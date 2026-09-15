import {
  confineSelectAllOnKeyDown,
  isSelectAllHotkey,
  selectElementContents,
} from './confine-select-all';
import { describe, expect, it } from 'vitest';

function hotkey(
  overrides: Partial<{
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  }> = {}
) {
  return {
    key: 'a',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  };
}

describe('isSelectAllHotkey', () => {
  it('matches Ctrl+A and Cmd+A', () => {
    expect(isSelectAllHotkey(hotkey({ ctrlKey: true }))).toBe(true);
    expect(isSelectAllHotkey(hotkey({ metaKey: true }))).toBe(true);
    expect(isSelectAllHotkey(hotkey({ key: 'A', ctrlKey: true }))).toBe(true);
  });

  it('ignores other modifiers and keys', () => {
    expect(isSelectAllHotkey(hotkey())).toBe(false);
    expect(isSelectAllHotkey(hotkey({ ctrlKey: true, shiftKey: true }))).toBe(
      false
    );
    expect(isSelectAllHotkey(hotkey({ ctrlKey: true, altKey: true }))).toBe(
      false
    );
    expect(isSelectAllHotkey(hotkey({ key: 'b', ctrlKey: true }))).toBe(false);
  });
});

describe('selectElementContents', () => {
  it('selects only the target element text', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>outside</p><pre>int main() {}</pre>';
    document.body.append(root);

    const pre = root.querySelector('pre');
    expect(pre).not.toBeNull();
    selectElementContents(pre!);

    expect(window.getSelection()?.toString()).toBe('int main() {}');
    root.remove();
  });
});

describe('confineSelectAllOnKeyDown', () => {
  it('prevents default and selects the current target on Ctrl+A', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>outside</p><pre>int main() {}</pre>';
    document.body.append(root);

    const pre = root.querySelector('pre');
    expect(pre).not.toBeNull();

    let prevented = false;
    confineSelectAllOnKeyDown({
      ...hotkey({ ctrlKey: true }),
      preventDefault: () => {
        prevented = true;
      },
      currentTarget: pre!,
    });

    expect(prevented).toBe(true);
    expect(window.getSelection()?.toString()).toBe('int main() {}');
    root.remove();
  });

  it('does nothing for other keys', () => {
    const pre = document.createElement('pre');
    pre.textContent = 'int main() {}';

    let prevented = false;
    confineSelectAllOnKeyDown({
      ...hotkey(),
      preventDefault: () => {
        prevented = true;
      },
      currentTarget: pre,
    });

    expect(prevented).toBe(false);
  });
});
