import { useClipboardCopy } from './use-clipboard-copy';
import { act } from 'react';
import { expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

test('copies text and sets copied on success', async () => {
  const writeText = mockClipboard();
  const { result } = await renderHook(() => useClipboardCopy('int main() {}'));

  await act(async () => {
    await result.current.onCopy();
  });

  expect(writeText).toHaveBeenCalledWith('int main() {}');
  expect(result.current.copied).toBe(true);
});

test('keeps copied false when clipboard write is rejected', async () => {
  const writeText = mockClipboard(
    vi.fn().mockRejectedValue(new Error('denied'))
  );
  const { result } = await renderHook(() => useClipboardCopy('int main() {}'));

  await act(async () => {
    await result.current.onCopy();
  });

  expect(writeText).toHaveBeenCalledWith('int main() {}');
  expect(result.current.copied).toBe(false);
});

test('does not copy empty text', async () => {
  const writeText = mockClipboard();
  const { result } = await renderHook(() => useClipboardCopy(''));

  await act(async () => {
    await result.current.onCopy();
  });

  expect(writeText).not.toHaveBeenCalled();
  expect(result.current.copied).toBe(false);
});

test('resolves getter text at click time', async () => {
  const writeText = mockClipboard();
  const { result } = await renderHook(() =>
    useClipboardCopy(() => 'from getter')
  );

  await act(async () => {
    await result.current.onCopy();
  });

  expect(writeText).toHaveBeenCalledWith('from getter');
  expect(result.current.copied).toBe(true);
});
