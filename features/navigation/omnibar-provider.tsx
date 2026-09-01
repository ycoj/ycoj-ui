'use client';

import Omnibar from './omnibar';
import { isOmnibarHotkey } from './omnibar-utils';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type OmnibarContextValue = {
  open: () => void;
};

const OmnibarContext = createContext<OmnibarContextValue | null>(null);

export function useOmnibar() {
  const value = useContext(OmnibarContext);
  if (!value) throw new Error('useOmnibar must be used in OmnibarProvider');
  return value;
}

type Props = {
  children: React.ReactNode;
};

export default function OmnibarProvider({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOmnibarHotkey(event)) return;
      event.preventDefault();
      setIsOpen((current) => !current);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <OmnibarContext.Provider value={{ open }}>
      {children}
      <Omnibar open={isOpen} onOpenChange={setIsOpen} />
    </OmnibarContext.Provider>
  );
}
