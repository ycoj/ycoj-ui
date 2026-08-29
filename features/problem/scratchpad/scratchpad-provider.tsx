'use client';

import type { ScratchpadConfig } from '@/features/problem/scratchpad/scratchpad-types';
import ScratchpadWorkspace from '@/features/problem/scratchpad/scratchpad-workspace';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type ScratchpadContextValue = {
  open: () => void;
};

const ScratchpadContext = createContext<ScratchpadContextValue | null>(null);

export function useScratchpad() {
  const value = useContext(ScratchpadContext);
  if (!value)
    throw new Error('useScratchpad must be used in ScratchpadProvider');
  return value;
}

type Props = {
  config: ScratchpadConfig;
  statement: React.ReactNode;
  children: React.ReactNode;
};

export default function ScratchpadProvider({
  config,
  statement,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    if (isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        open();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, open]);

  return (
    <ScratchpadContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <ScratchpadWorkspace
          key={`${config.domainId}:${config.problemDocId}:${config.tid ?? ''}`}
          config={config}
          statement={statement}
          onClose={close}
        />
      )}
    </ScratchpadContext.Provider>
  );
}
