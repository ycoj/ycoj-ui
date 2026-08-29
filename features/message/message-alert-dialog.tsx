'use client';

import { Button } from '@/shared/components/ui/button';
import type { MessageEvent } from '@/shared/types/message';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

type Props = {
  event: MessageEvent | null;
  content: string;
  onClose: () => void;
};

export default function MessageAlertDialog({ event, content, onClose }: Props) {
  const t = useTranslations('messages');
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!event) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (firstFocusable) firstFocusable.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div
      className="bg-background/80 fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="message-alert-title"
      aria-describedby="message-alert-content"
    >
      <div
        ref={dialogRef}
        className="bg-card w-full max-w-md rounded-lg border p-5 shadow-lg"
      >
        <h2 id="message-alert-title" className="text-lg font-semibold">
          {t('alertTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('messageFrom', { name: event.udoc.uname })}
        </p>
        <p
          id="message-alert-content"
          className="mt-4 whitespace-pre-wrap break-words text-sm"
          data-llm-text={content}
        >
          {content}
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={onClose}>{t('dismiss')}</Button>
        </div>
      </div>
    </div>
  );
}
