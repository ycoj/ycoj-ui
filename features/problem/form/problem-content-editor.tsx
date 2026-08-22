'use client';

import {
  parseProblemContent,
  PROBLEM_CONTENT_LANGUAGES,
  PROBLEM_LANGUAGE_LABELS,
  serializeProblemContent,
  type SupportedProblemLanguage,
} from '@/features/problem/parse-problem-content';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useLocale } from 'next-intl';
import { useState } from 'react';

type Props = {
  defaultValue: string;
  disabled?: boolean;
  onChange: (serialized: string) => void;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
  className?: string;
};

type ContentMap = Partial<Record<SupportedProblemLanguage, string>>;

export default function ProblemContentEditor({
  defaultValue,
  disabled,
  onChange,
  onBlur,
  'aria-invalid': ariaInvalid,
  className,
}: Props) {
  const uiLocale = useLocale();
  const [contents, setContents] = useState<ContentMap>(() => {
    const record: ContentMap = {};
    for (const { language, content } of parseProblemContent(defaultValue))
      record[language] = content;
    return record;
  });
  const [activeLanguage, setActiveLanguage] =
    useState<SupportedProblemLanguage>(() => {
      const withContent = PROBLEM_CONTENT_LANGUAGES.find((language) =>
        contents[language]?.trim()
      );
      return withContent ?? (uiLocale.startsWith('en') ? 'en' : 'zh');
    });

  const handleEditorChange = (value: string) => {
    const next = { ...contents, [activeLanguage]: value };
    setContents(next);
    onChange(serializeProblemContent(next));
  };

  return (
    <div className="space-y-2">
      <Tabs
        value={activeLanguage}
        onValueChange={(value) =>
          setActiveLanguage(value as SupportedProblemLanguage)
        }
      >
        <TabsList>
          {PROBLEM_CONTENT_LANGUAGES.map((language) => (
            <TabsTrigger key={language} value={language} disabled={disabled}>
              {PROBLEM_LANGUAGE_LABELS[language]}
              {contents[language]?.trim() && (
                <span className="bg-primary ml-1 inline-block size-1.5 rounded-full" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <MarkdownEditor
        value={contents[activeLanguage] ?? ''}
        onChange={async (event) => handleEditorChange(event.target.value)}
        onBlur={async () => onBlur?.()}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={className}
      />
    </div>
  );
}
