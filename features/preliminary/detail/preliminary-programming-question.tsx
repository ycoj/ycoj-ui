'use client';

import ClientApis from '@/api/client/method';
import { usePreliminaryAnswers } from '@/features/preliminary/detail/preliminary-answer-provider';
import ScratchpadEditor from '@/features/problem/scratchpad/scratchpad-editor';
import ScratchpadRecords from '@/features/problem/scratchpad/scratchpad-records';
import type {
  ScratchpadLanguageOption,
  ScratchpadLanguages,
  ScratchpadRecord,
} from '@/features/problem/scratchpad/scratchpad-types';
import {
  createOptimisticScratchpadRecord,
  flattenScratchpadLanguages,
  mergeScratchpadRecords,
  parseScratchpadRecordMessage,
  parseScratchpadRecords,
  resolveScratchpadLanguage,
} from '@/features/problem/scratchpad/scratchpad-utils';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useRecordSocket } from '@/shared/hooks/use-record-socket';
import { getSyntaxLanguage } from '@/shared/lib/code-language';
import type { PreliminaryQuestion } from '@/shared/types/preliminary';
import type { PublicProjectionProblem } from '@/shared/types/problem';
import type { User } from '@/shared/types/user';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

type Props = {
  question: Pick<
    PreliminaryQuestion,
    'id' | 'type' | 'multiplier' | 'languages'
  >;
  problem: PublicProjectionProblem;
  statement: ReactNode;
  languages: ScratchpadLanguages;
  user: User | null;
  isReadOnly: boolean;
};

function filterLanguages(
  languages: ScratchpadLanguages,
  allowed: string[] | undefined
): ScratchpadLanguages {
  if (!allowed?.length) return languages;
  const matches = (name: string, family: string) =>
    allowed.includes(name) ||
    allowed.includes(family) ||
    allowed.some((value) => name.startsWith(`${value}.`));
  const entries: Array<[string, ScratchpadLanguages[string]]> = Object.entries(
    languages
  )
    .map(
      ([familyKey, family]) =>
        [
          familyKey,
          {
            ...family,
            versions: family.versions.filter((version) =>
              matches(version.name, familyKey)
            ),
          },
        ] as [string, ScratchpadLanguages[string]]
    )
    .filter(([, family]) => family.versions.length > 0);
  return Object.fromEntries(entries);
}

function languageLabel(options: ScratchpadLanguageOption[], language: string) {
  return (
    options.find((option) => option.name === language)?.display ?? language
  );
}

export default function PreliminaryProgrammingQuestion({
  question,
  problem,
  statement,
  languages: availableLanguages,
  user,
  isReadOnly,
}: Props) {
  const t = useTranslations('preliminary');
  const tScratchpad = useTranslations('problem.scratchpad');
  const { programmingAnswers, setProgrammingAnswer, isReady } =
    usePreliminaryAnswers();
  const languages = useMemo(
    () => filterLanguages(availableLanguages, question.languages),
    [availableLanguages, question.languages]
  );
  const options = useMemo(
    () => flattenScratchpadLanguages(languages),
    [languages]
  );
  const answer = programmingAnswers[question.id];
  const defaultLanguage = useMemo(
    () => resolveScratchpadLanguage(languages, answer?.lang, user?.codeLang),
    [answer?.lang, languages, user?.codeLang]
  );
  const language = defaultLanguage;
  const code = answer?.code ?? '';
  const familyKey = useMemo(
    () => options.find((option) => option.name === language)?.familyKey ?? '',
    [language, options]
  );
  const [posting, setPosting] = useState(false);
  const [records, setRecords] = useState<ScratchpadRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [recordsUnavailable, setRecordsUnavailable] = useState(false);

  const handleRecord = useCallback((record: ScratchpadRecord) => {
    setRecords((current) => mergeScratchpadRecords(current, [record]));
  }, []);

  useRecordSocket({
    path: '/record-conn',
    params: {
      pretest: true,
      uidOrName: user?._id ?? 0,
      pid: problem.docId,
      domainId: problem.domainId,
    },
    onMessage(message) {
      const record = parseScratchpadRecordMessage(message);
      if (record) handleRecord(record);
    },
  });

  useEffect(() => {
    if (!user?._id || recordsLoaded) return;
    void ClientApis.Record.getFullList({ pid: problem.docId })
      .send()
      .then((response) => {
        if ('error' in response) {
          setRecordsUnavailable(true);
          return;
        }
        setRecords((current) =>
          mergeScratchpadRecords(
            current,
            parseScratchpadRecords(response.rdocs)
          )
        );
      })
      .catch(() => setRecordsUnavailable(true))
      .finally(() => setRecordsLoaded(true));
  }, [problem.docId, recordsLoaded, user?._id]);

  const updateAnswer = useCallback(
    (next: { lang: string; code: string }) => {
      setProgrammingAnswer(question.id, next);
    },
    [question.id, setProgrammingAnswer]
  );

  const submit = useCallback(async () => {
    if (isReadOnly || posting || !isReady) return;
    if (!language || !code.trim()) {
      toast.error(tScratchpad('codeRequired'));
      return;
    }
    setPosting(true);
    try {
      const pid = problem.pid || String(problem.docId);
      const response = await ClientApis.Problem.submitProblem(pid, {
        lang: language,
        code,
      }).send();
      if (response?.error) {
        throw new Error(parseErrorMessage(response.error));
      }
      const rid = response?.rid;
      if (!rid) throw new Error(tScratchpad('submitFailed'));
      setRecords((current) =>
        mergeScratchpadRecords(current, [
          createOptimisticScratchpadRecord({
            id: rid,
            domainId: problem.domainId,
            pid: problem.docId,
            uid: user?._id ?? 0,
            lang: language,
          }),
        ])
      );
      toast.success(tScratchpad('submitted'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tScratchpad('submitFailed')
      );
    } finally {
      setPosting(false);
    }
  }, [
    code,
    isReady,
    isReadOnly,
    language,
    posting,
    problem.docId,
    problem.domainId,
    problem.pid,
    tScratchpad,
    user?._id,
  ]);

  if (!options.length) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        {t('programmingUnavailable')}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border bg-card/40 p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{problem.title}</span>
        <span className="text-xs text-muted-foreground">
          {question.multiplier && question.multiplier !== 1
            ? `×${question.multiplier}`
            : null}
        </span>
      </div>
      <div className="min-w-0 border-b pb-3 [&_.markdown]:min-w-0 [&_.markdown]:max-w-full [&_.markdown]:overflow-x-auto">
        {statement}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={language}
          onValueChange={(next) => updateAnswer({ lang: next, code })}
          disabled={isReadOnly || posting}
        >
          <SelectTrigger
            size="sm"
            className="w-52"
            aria-label={tScratchpad('language')}
          >
            <SelectValue placeholder={tScratchpad('language')} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languages).map(([key, family]) => (
              <SelectGroup key={key}>
                <SelectLabel>{family.display}</SelectLabel>
                {family.versions.map((version) => (
                  <SelectItem key={version.name} value={version.name}>
                    {version.display}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={() => void submit()}
          disabled={isReadOnly || posting || !isReady}
        >
          <Play />
          {posting ? t('submitting') : t('submit')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {language
            ? languageLabel(options, language)
            : tScratchpad('language')}
        </span>
      </div>
      <ScratchpadEditor
        clangdEnabled={false}
        compilerLanguage={language}
        onDisableClangd={() => undefined}
        value={code}
        onChange={(next) => updateAnswer({ lang: language, code: next })}
        language={getSyntaxLanguage(familyKey) || undefined}
        height="320px"
        readOnly={isReadOnly || posting}
        ariaLabel={t('codePlaceholder')}
        className="rounded-md"
      />
      <ScratchpadRecords
        records={records}
        languages={options}
        loading={Boolean(user?._id) && !recordsLoaded}
        unavailable={recordsUnavailable}
      />
    </div>
  );
}
