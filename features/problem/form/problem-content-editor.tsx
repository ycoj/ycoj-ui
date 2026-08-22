'use client';

import {
  parseProblemContent,
  PROBLEM_CONTENT_LANGUAGES,
  PROBLEM_LANGUAGE_LABELS,
  serializeProblemContent,
  type SupportedProblemLanguage,
} from '@/features/problem/parse-problem-content';
import MarkdownEditor from '@/shared/components/markdown-editor';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (serialized: string) => void;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
  className?: string;
};

type ContentMap = Partial<Record<SupportedProblemLanguage, string>>;

function getDefaultLanguage(
  contents: ContentMap,
  uiLocale: string
): SupportedProblemLanguage {
  const withContent = PROBLEM_CONTENT_LANGUAGES.find((language) =>
    contents[language]?.trim()
  );
  return withContent ?? (uiLocale.startsWith('en') ? 'en' : 'zh');
}

export default function ProblemContentEditor({
  value,
  disabled,
  onChange,
  onBlur,
  'aria-invalid': ariaInvalid,
  className,
}: Props) {
  const uiLocale = useLocale();
  const contents: ContentMap = useMemo(() => {
    const map: ContentMap = {};
    for (const { language, content } of parseProblemContent(value)) {
      map[language] = content;
    }
    return map;
  }, [value]);

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedProblemLanguage | null>(null);
  const [prevValue, setPrevValue] = useState(value);
  const [isInternalChange, setIsInternalChange] = useState(false);

  if (prevValue !== value) {
    setPrevValue(value);
    if (!isInternalChange && selectedLanguage !== null) {
      setSelectedLanguage(null);
    }
    if (isInternalChange) {
      setIsInternalChange(false);
    }
  }

  const effectiveActiveLanguage =
    selectedLanguage ?? getDefaultLanguage(contents, uiLocale);

  const handleEditorChange = (
    language: SupportedProblemLanguage,
    nextValue: string
  ) => {
    setIsInternalChange(true);
    const next = { ...contents, [language]: nextValue };
    onChange(serializeProblemContent(next));
  };

  return (
    <div className="space-y-2">
      <Tabs
        value={effectiveActiveLanguage}
        onValueChange={(val) =>
          setSelectedLanguage(val as SupportedProblemLanguage)
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
        {PROBLEM_CONTENT_LANGUAGES.map((language) => (
          <TabsContent key={language} value={language}>
            <MarkdownEditor
              value={contents[language] ?? ''}
              onChange={async (event) =>
                handleEditorChange(language, event.target.value)
              }
              onBlur={async () => onBlur?.()}
              disabled={disabled}
              aria-invalid={ariaInvalid}
              className={className}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
