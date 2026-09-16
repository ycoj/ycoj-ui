import { useClipboardCopy } from './use-clipboard-copy';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

describe('useClipboardCopy', () => {
  it('copies text and sets copied on success', async () => {
    const writeText = mockClipboard();
    const { result } = renderHook(() => useClipboardCopy('int main() {}'));

    await act(async () => {
      await result.current.onCopy();
    });

    expect(writeText).toHaveBeenCalledWith('int main() {}');
    expect(result.current.copied).toBe(true);
  });

  it('keeps copied false when clipboard write is rejected', async () => {
    const writeText = mockClipboard(
      vi.fn().mockRejectedValue(new Error('denied'))
    );
    const { result } = renderHook(() => useClipboardCopy('int main() {}'));

    await act(async () => {
      await result.current.onCopy();
    });

    expect(writeText).toHaveBeenCalledWith('int main() {}');
    expect(result.current.copied).toBe(false);
  });

  it('does not copy empty text', async () => {
    const writeText = mockClipboard();
    const { result } = renderHook(() => useClipboardCopy(''));

    await act(async () => {
      await result.current.onCopy();
    });

    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.copied).toBe(false);
  });

  it('resolves getter text at click time', async () => {
    const writeText = mockClipboard();
    const { result } = renderHook(() => useClipboardCopy(() => 'from getter'));

    await act(async () => {
      await result.current.onCopy();
    });

    expect(writeText).toHaveBeenCalledWith('from getter');
    expect(result.current.copied).toBe(true);
  });
});
