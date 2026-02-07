'use client';

import './style.css';
import { cn } from '@/shared/lib/utils';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import type { ChangeEvent, FocusEvent } from 'react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeHandler } from 'react-hook-form';

type MarkdownEditorProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: ChangeHandler;
  onBlur?: ChangeHandler;
  'aria-invalid'?: boolean;
};

type CrepeEditorProps = {
  initialValue: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
};

function CrepeEditor({
  initialValue,
  disabled,
  onValueChange,
  onBlur,
}: CrepeEditorProps) {
  const crepeRef = useRef<Crepe | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const onValueChangeRef = useRef(onValueChange);
  const onBlurRef = useRef(onBlur);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEditor((root) => {
    const normalizeButtons = () => {
      root
        .querySelectorAll<HTMLButtonElement>('button:not([type])')
        .forEach((button) => {
          button.type = 'button';
        });
    };

    normalizeButtons();
    observerRef.current?.disconnect();
    const observer = new MutationObserver(normalizeButtons);
    observer.observe(root, {
      childList: true,
      subtree: true,
    });
    observerRef.current = observer;

    const crepe = new Crepe({
      root,
      defaultValue: initialValue,
      features: {
        'block-edit': false,
      },
      featureConfigs: {
        'code-mirror': {
          theme: vscodeLight,
        },
      },
    });
    crepeRef.current = crepe;
    crepe.on((listener) => {
      listener
        .markdownUpdated((ctx, markdown) => {
          onValueChangeRef.current(markdown);
        })
        .blur(() => {
          onBlurRef.current?.();
        });
    });
    return crepe;
  }, []);

  useEffect(() => {
    crepeRef.current?.setReadonly(!!disabled);
  }, [disabled]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return <Milkdown />;
}

const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  (
    {
      id,
      name,
      defaultValue,
      disabled,
      required,
      className,
      onChange,
      onBlur,
      'aria-invalid': ariaInvalid,
    },
    ref
  ) => {
    const initialValue = defaultValue ?? '';
    const [innerValue, setInnerValue] = useState(() => initialValue);
    const lastValueRef = useRef(initialValue);

    const handleValueChange = useCallback(
      (nextValue: string) => {
        if (nextValue === lastValueRef.current) return;
        lastValueRef.current = nextValue;
        setInnerValue(nextValue);

        if (onChange) {
          const event = {
            target: { name, value: nextValue },
          } as ChangeEvent<HTMLTextAreaElement>;
          onChange(event as Parameters<ChangeHandler>[0]);
        }
      },
      [name, onChange]
    );

    const handleBlur = useCallback(() => {
      if (!onBlur) return;
      const event = {
        target: { name, value: lastValueRef.current },
      } as FocusEvent<HTMLTextAreaElement>;
      onBlur(event as Parameters<ChangeHandler>[0]);
    }, [name, onBlur]);

    const currentValue = innerValue;

    return (
      <div
        className={cn(
          'space-y-2 border rounded-lg min-h-160 max-h-[75vh] overflow-y-auto p-2',
          className
        )}
      >
        <MilkdownProvider>
          <CrepeEditor
            initialValue={initialValue}
            disabled={disabled}
            onValueChange={handleValueChange}
            onBlur={handleBlur}
          />
        </MilkdownProvider>
        <textarea
          ref={ref}
          id={id}
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className="hidden"
          readOnly
          tabIndex={-1}
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
