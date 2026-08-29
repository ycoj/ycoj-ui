import { useCallback, useEffect, useState } from 'react';

export type ClipboardText = string | (() => string);

export function useClipboardCopy(text: ClipboardText): {
  copied: boolean;
  onCopy: () => Promise<void>;
} {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(id);
  }, [copied]);

  const onCopy = useCallback(async () => {
    const value = typeof text === 'function' ? text() : text;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return { copied, onCopy };
}
