'use client';

import './style.css';
import { cn } from '@/shared/lib/utils';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { useLocale } from 'next-intl';
import type { ChangeEvent, FocusEvent } from 'react';
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ChangeHandler } from 'react-hook-form';

type MarkdownEditorProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: ChangeHandler;
  onBlur?: ChangeHandler;
  'aria-invalid'?: boolean;
};

const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  (
    {
      id,
      name,
      defaultValue,
      value: controlledValue,
      disabled,
      required,
      className,
      onChange,
      onBlur,
      'aria-invalid': ariaInvalid,
    },
    ref
  ) => {
    const locale = useLocale();
    const [internalValue, setInternalValue] = useState(
      () => defaultValue ?? ''
    );
    const lastValueRef = useRef(controlledValue ?? defaultValue ?? '');
    useLayoutEffect(() => {
      if (controlledValue !== undefined) {
        lastValueRef.current = controlledValue;
      }
    }, [controlledValue]);
    const value = controlledValue ?? internalValue;

    const handleValueChange = useCallback(
      (nextValue: string) => {
        if (nextValue === lastValueRef.current) return;

        lastValueRef.current = nextValue;
        if (controlledValue === undefined) {
          setInternalValue(nextValue);
        }

        if (onChange) {
          const event = {
            target: { name, value: nextValue },
          } as ChangeEvent<HTMLTextAreaElement>;
          onChange(event as Parameters<ChangeHandler>[0]);
        }
      },
      [name, onChange, controlledValue]
    );

    const handleBlur = useCallback(() => {
      if (!onBlur) return;

      const event = {
        target: { name, value: lastValueRef.current },
      } as FocusEvent<HTMLTextAreaElement>;
      onBlur(event as Parameters<ChangeHandler>[0]);
    }, [name, onBlur]);

    return (
      <>
        <MdEditor
          value={value}
          onChange={handleValueChange}
          onBlur={handleBlur}
          language={locale.startsWith('en') ? 'en-US' : 'zh-CN'}
          disabled={disabled}
          preview
          noUploadImg
          toolbarsExclude={['save', 'github']}
          className={cn(
            'markdown-editor',
            ariaInvalid && 'markdown-editor-invalid',
            className
          )}
          style={{ height: '75vh', minHeight: '40rem' }}
        />
        <textarea
          ref={ref}
          id={id}
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className="hidden"
          readOnly
          tabIndex={-1}
        />
      </>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
