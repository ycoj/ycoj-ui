'use client';

import ClientApis from '@/api/client/method';
import {
  getScratchpadDraft,
  saveScratchpadDraft,
} from '@/features/problem/scratchpad/draft-storage';
import ScratchpadPretest from '@/features/problem/scratchpad/scratchpad-pretest';
import ScratchpadRecords from '@/features/problem/scratchpad/scratchpad-records';
import ScratchpadSettingsPanel from '@/features/problem/scratchpad/scratchpad-settings';
import type {
  ScratchpadConfig,
  ScratchpadRecord,
  ScratchpadSettings,
} from '@/features/problem/scratchpad/scratchpad-types';
import {
  flattenScratchpadLanguages,
  formatScratchpadPretestOutput,
  canRunScratchpadPretest,
  createOptimisticScratchpadRecord,
  getScratchpadDraftId,
  getScratchpadFamilyKey,
  isPretestRecord,
  mergeScratchpadRecords,
  parseScratchpadRecordMessage,
  parseScratchpadRecords,
  resolveScratchpadLanguage,
} from '@/features/problem/scratchpad/scratchpad-utils';
import CodeEditor from '@/shared/components/code/code-editor';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { ProblemSampleActionProvider } from '@/shared/components/markdown/components/problem-sample';
import { Button } from '@/shared/components/ui/button';
import { Kbd } from '@/shared/components/ui/kbd';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { STATUS_TEXT_KEYS } from '@/shared/configs/status';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useRecordSocket } from '@/shared/hooks/use-record-socket';
import { getSyntaxLanguage } from '@/shared/lib/code-language';
import {
  CirclePlay,
  FileText,
  Flag,
  LogOut,
  Play,
  Settings,
  SlidersHorizontal,
  TerminalSquare,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Group,
  Panel,
  Separator as ResizeHandle,
} from 'react-resizable-panels';
import { toast } from 'sonner';

const SETTINGS_KEY = 'ycoj.scratchpad.settings';
const PRETEST_VISIBLE_KEY = 'ycoj.scratchpad.pretest-visible';
const RECORDS_VISIBLE_KEY = 'ycoj.scratchpad.records-visible';
const DEFAULT_SETTINGS: ScratchpadSettings = {
  fontSize: 14,
  tabSize: 4,
  theme: 'system',
};

type Props = {
  config: ScratchpadConfig;
  statement: React.ReactNode;
  onClose: () => void;
};

type MobileTab = 'problem' | 'editor' | 'pretest' | 'records' | 'settings';

function readSettings(): ScratchpadSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(SETTINGS_KEY) ?? '{}'
    ) as Partial<ScratchpadSettings>;
    return {
      fontSize:
        typeof value.fontSize === 'number'
          ? Math.min(32, Math.max(10, value.fontSize))
          : DEFAULT_SETTINGS.fontSize,
      tabSize:
        typeof value.tabSize === 'number'
          ? Math.min(8, Math.max(1, value.tabSize))
          : DEFAULT_SETTINGS.tabSize,
      theme: ['light', 'dark', 'system'].includes(value.theme ?? '')
        ? (value.theme as ScratchpadSettings['theme'])
        : DEFAULT_SETTINGS.theme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function readVisibility(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function ScratchpadSocket({
  config,
  onRecord,
}: {
  config: ScratchpadConfig;
  onRecord: (record: ScratchpadRecord) => void;
}) {
  useRecordSocket({
    path: '/record-conn',
    params: {
      pretest: true,
      uidOrName: config.userId,
      pid: config.problemDocId,
      domainId: config.domainId,
      tid: config.tid,
    },
    onMessage(message) {
      const record = parseScratchpadRecordMessage(message);
      if (record) onRecord(record);
    },
  });
  return null;
}

function ResizeSeparator({
  orientation,
}: {
  orientation: 'horizontal' | 'vertical';
}) {
  return (
    <ResizeHandle
      className={
        orientation === 'horizontal'
          ? 'group relative flex w-1.5 items-center justify-center bg-border outline-none focus-visible:bg-primary'
          : 'group relative flex h-1.5 items-center justify-center bg-border outline-none focus-visible:bg-primary'
      }
    >
      <span
        className={
          orientation === 'horizontal'
            ? 'h-8 w-0.5 rounded-full bg-muted-foreground/40 group-hover:bg-primary'
            : 'h-0.5 w-8 rounded-full bg-muted-foreground/40 group-hover:bg-primary'
        }
      />
    </ResizeHandle>
  );
}

export default function ScratchpadWorkspace({
  config,
  statement,
  onClose,
}: Props) {
  const t = useTranslations('problem.scratchpad');
  const tJudge = useTranslations('judgeStatus.label');
  const isMobile = useIsMobile();
  const rootRef = useRef<HTMLDivElement>(null);
  const draftErrorShown = useRef(false);
  const recordsRequestStarted = useRef(false);
  const activePretestRid = useRef<string | undefined>(undefined);
  const pretestRecords = useRef(new Map<string, ScratchpadRecord>());
  const options = useMemo(
    () => flattenScratchpadLanguages(config.languages),
    [config.languages]
  );
  const defaultLanguage = useMemo(
    () =>
      resolveScratchpadLanguage(
        config.languages,
        undefined,
        config.preferredLanguage
      ),
    [config.languages, config.preferredLanguage]
  );
  const defaultCanPretest = canRunScratchpadPretest(
    config.problemType,
    options.find((option) => option.name === defaultLanguage)
  );
  const draftId = useMemo(
    () =>
      getScratchpadDraftId({
        userId: config.userId,
        domainId: config.domainId,
        problemDocId: config.problemDocId,
        eventKind: config.eventKind,
        tid: config.tid,
      }),
    [
      config.domainId,
      config.eventKind,
      config.problemDocId,
      config.tid,
      config.userId,
    ]
  );

  const [code, setCode] = useState(config.codeTemplate ?? '');
  const [language, setLanguage] = useState(defaultLanguage);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [settings, setSettings] = useState(readSettings);
  const [pretestVisible, setPretestVisible] = useState(
    () => defaultCanPretest && readVisibility(PRETEST_VISIBLE_KEY)
  );
  const [recordsVisible, setRecordsVisible] = useState(() =>
    readVisibility(RECORDS_VISIBLE_KEY)
  );
  const [desktopPage, setDesktopPage] = useState<'problem' | 'settings'>(
    'problem'
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [pretestInput, setPretestInput] = useState('');
  const [pretestOutput, setPretestOutput] = useState('');
  const [posting, setPosting] = useState<'pretest' | 'submit' | null>(null);
  const [pretestCooldown, setPretestCooldown] = useState(0);
  const [submitCooldown, setSubmitCooldown] = useState(0);
  const [records, setRecords] = useState<ScratchpadRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [recordsUnavailable, setRecordsUnavailable] = useState(false);

  const familyKey = getScratchpadFamilyKey(config.languages, language);
  const canPretest = canRunScratchpadPretest(
    config.problemType,
    options.find((option) => option.name === language)
  );
  const togglePretest = useCallback(() => {
    if (pretestVisible) {
      if (isMobile) setMobileTab('editor');
      setPretestVisible(false);
      return;
    }
    setPretestVisible(true);
    if (isMobile) setMobileTab('pretest');
  }, [isMobile, pretestVisible]);
  const toggleRecords = useCallback(() => {
    if (recordsVisible) {
      if (isMobile) setMobileTab('editor');
      setRecordsVisible(false);
      return;
    }
    setRecordsVisible(true);
    if (isMobile) setMobileTab('records');
  }, [isMobile, recordsVisible]);
  const fillPretestFromSample = useCallback(
    (input: string) => {
      setPretestInput(input);
      setPretestOutput('');
      setPretestVisible(true);
      if (isMobile) setMobileTab('pretest');
    },
    [isMobile]
  );
  const sampleAction = useMemo(
    () => ({
      label: t('fillSample'),
      onSelect: fillPretestFromSample,
    }),
    [fillPretestFromSample, t]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    rootRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      window.localStorage.setItem(PRETEST_VISIBLE_KEY, String(pretestVisible));
      window.localStorage.setItem(RECORDS_VISIBLE_KEY, String(recordsVisible));
    } catch {
      // The scratchpad remains usable when browser preference storage is blocked.
    }
  }, [pretestVisible, recordsVisible, settings]);

  useEffect(() => {
    let active = true;
    void getScratchpadDraft(draftId)
      .then((draft) => {
        if (!active || !draft) return;
        setCode(draft.code);
        setLanguage(
          resolveScratchpadLanguage(
            config.languages,
            draft.language,
            config.preferredLanguage
          )
        );
      })
      .catch(() => {
        if (!draftErrorShown.current) {
          draftErrorShown.current = true;
          toast.error(t('draftUnavailable'));
        }
      })
      .finally(() => {
        if (active) setDraftLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [config.languages, config.preferredLanguage, draftId, t]);

  useEffect(() => {
    if (!draftLoaded) return;
    const timeout = window.setTimeout(() => {
      void saveScratchpadDraft({ id: draftId, code, language }).catch(() => {
        if (!draftErrorShown.current) {
          draftErrorShown.current = true;
          toast.error(t('draftUnavailable'));
        }
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [code, draftId, draftLoaded, language, t]);

  useEffect(() => {
    if (!pretestCooldown && !submitCooldown) return;
    const interval = window.setInterval(() => {
      setPretestCooldown((value) => Math.max(0, value - 1));
      setSubmitCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pretestCooldown, submitCooldown]);

  useEffect(() => {
    if (!recordsVisible || recordsLoaded || recordsRequestStarted.current) {
      return;
    }
    recordsRequestStarted.current = true;
    void ClientApis.Record.getFullList({
      pid: config.problemDocId,
      tid: config.tid,
    })
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
  }, [config.problemDocId, config.tid, recordsLoaded, recordsVisible]);

  const getStatusText = useCallback(
    (status: number) => {
      const key = STATUS_TEXT_KEYS[status];
      return key ? tJudge(key) : t('unknownStatus');
    },
    [t, tJudge]
  );

  const handleRecord = useCallback(
    (record: ScratchpadRecord) => {
      if (isPretestRecord(record)) {
        pretestRecords.current.set(record._id, record);
        if (record._id === activePretestRid.current) {
          setPretestOutput(
            formatScratchpadPretestOutput(record, getStatusText(record.status))
          );
        }
        return;
      }
      setRecords((current) => mergeScratchpadRecords(current, [record]));
    },
    [getStatusText]
  );

  const ensureCode = useCallback(() => {
    if (code.trim()) return true;
    toast.error(t('codeRequired'));
    return false;
  }, [code, t]);

  const runPretest = useCallback(async () => {
    if (!canPretest || posting || pretestCooldown || !ensureCode()) return;
    setPosting('pretest');
    setPretestVisible(true);
    if (isMobile) setMobileTab('pretest');
    setPretestOutput(t('pretestQueued'));
    try {
      const response = await ClientApis.Problem.submitProblem(
        config.pid,
        { lang: language, code, input: [pretestInput], pretest: true },
        config.tid
      ).send();
      if (response?.error) throw new Error(parseErrorMessage(response.error));
      if (!response?.rid) throw new Error(t('pretestFailed'));
      activePretestRid.current = response.rid;
      const latestRecord = pretestRecords.current.get(response.rid);
      if (latestRecord) {
        setPretestOutput(
          formatScratchpadPretestOutput(
            latestRecord,
            getStatusText(latestRecord.status)
          )
        );
      }
      setPretestCooldown(5);
    } catch (error) {
      setPretestCooldown(3);
      const message =
        error instanceof Error ? error.message : t('pretestFailed');
      setPretestOutput(message);
      toast.error(message);
    } finally {
      setPosting(null);
    }
  }, [
    canPretest,
    code,
    config.pid,
    config.tid,
    ensureCode,
    getStatusText,
    isMobile,
    language,
    posting,
    pretestCooldown,
    pretestInput,
    t,
  ]);

  const submit = useCallback(async () => {
    if (posting || submitCooldown || !ensureCode()) return;
    setPosting('submit');
    try {
      const response = await ClientApis.Problem.submitProblem(
        config.pid,
        { lang: language, code },
        config.tid
      ).send();
      if (response?.error) throw new Error(parseErrorMessage(response.error));
      const rid = response?.rid;
      if (rid) {
        setRecords((current) =>
          mergeScratchpadRecords(current, [
            createOptimisticScratchpadRecord({
              id: rid,
              domainId: config.domainId,
              pid: config.problemDocId,
              uid: config.userId,
              lang: language,
              contest: config.tid,
            }),
          ])
        );
        setRecordsVisible(true);
        if (isMobile) setMobileTab('records');
        toast.success(t('submitted'));
      } else if (response?.tid) {
        setRecordsUnavailable(true);
        toast.success(t('submittedHidden'));
      } else {
        throw new Error(t('submitFailed'));
      }
      setSubmitCooldown(8);
    } catch (error) {
      setSubmitCooldown(3);
      toast.error(error instanceof Error ? error.message : t('submitFailed'));
    } finally {
      setPosting(null);
    }
  }, [
    code,
    config.domainId,
    config.pid,
    config.problemDocId,
    config.tid,
    config.userId,
    ensureCode,
    isMobile,
    language,
    posting,
    submitCooldown,
    t,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      const key = event.key.toLowerCase();
      if (event.altKey && key === 'q') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'F9' && canPretest) {
        event.preventDefault();
        void runPretest();
      } else if (event.key === 'F10') {
        event.preventDefault();
        void submit();
      } else if (event.altKey && key === 'p' && canPretest) {
        event.preventDefault();
        togglePretest();
      } else if (event.altKey && key === 'r') {
        event.preventDefault();
        toggleRecords();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canPretest, onClose, runPretest, submit, togglePretest, toggleRecords]);

  const editor = (
    <CodeEditor
      value={code}
      onChange={setCode}
      language={getSyntaxLanguage(familyKey) || undefined}
      height="100%"
      tabSize={settings.tabSize}
      fontSize={settings.fontSize}
      theme={settings.theme}
      ariaLabel={t('editor')}
      className="h-full rounded-none border-0"
    />
  );
  const pretest = (
    <ScratchpadPretest
      input={pretestInput}
      output={pretestOutput}
      onInputChange={setPretestInput}
    />
  );
  const recordPanel = (
    <ScratchpadRecords
      records={records}
      languages={options}
      loading={recordsVisible && !recordsLoaded}
      unavailable={recordsUnavailable}
    />
  );
  const settingsPanel = (
    <ScratchpadSettingsPanel settings={settings} onChange={setSettings} />
  );
  const problemStatement = canPretest ? (
    <ProblemSampleActionProvider action={sampleAction}>
      {statement}
    </ProblemSampleActionProvider>
  ) : (
    statement
  );

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('title', { title: config.title })}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex h-dvh flex-col bg-background text-foreground outline-none"
    >
      <ScratchpadSocket config={config} onRecord={handleRecord} />
      <header className="flex flex-wrap items-center gap-2 border-b bg-card px-2 py-2 md:px-3">
        <div className="mr-auto min-w-0 px-1">
          <div
            className="truncate text-sm font-semibold"
            data-llm-text={config.title}
          >
            {config.title}
          </div>
          <div
            className="text-xs text-muted-foreground"
            data-llm-text={t('workspace')}
          >
            {t('workspace')}
          </div>
        </div>

        {canPretest && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void runPretest()}
            disabled={posting !== null || pretestCooldown > 0}
            className="gap-2"
          >
            <CirclePlay />
            <span className="hidden sm:inline">
              {posting === 'pretest' ? t('running') : t('run')}
            </span>
            {pretestCooldown > 0 && <span>({pretestCooldown}s)</span>}
            <Kbd className="hidden self-center bg-muted text-foreground lg:inline-flex">
              F9
            </Kbd>
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => void submit()}
          disabled={posting !== null || submitCooldown > 0}
          className="gap-2"
        >
          <Play />
          <span className="hidden sm:inline">
            {posting === 'submit' ? t('submitting') : t('submit')}
          </span>
          {submitCooldown > 0 && <span>({submitCooldown}s)</span>}
          <Kbd className="hidden self-center bg-primary-foreground/15 text-inherit lg:inline-flex">
            F10
          </Kbd>
        </Button>

        <Select
          value={language}
          onValueChange={setLanguage}
          disabled={posting !== null}
        >
          <SelectTrigger
            size="sm"
            className="max-w-48"
            aria-label={t('language')}
          >
            <SelectValue placeholder={t('language')} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(config.languages).map(([key, family]) => (
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

        {canPretest && (
          <Button
            size="icon-sm"
            variant={pretestVisible ? 'secondary' : 'ghost'}
            onClick={togglePretest}
            aria-label={t('togglePretest')}
            title={`${t('pretest')} (Alt+P)`}
          >
            <TerminalSquare />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant={recordsVisible ? 'secondary' : 'ghost'}
          onClick={toggleRecords}
          aria-label={t('toggleRecords')}
          title={`${t('records')} (Alt+R)`}
        >
          <Flag />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="gap-2"
          aria-label={t('exit')}
        >
          <LogOut />
          <span className="hidden sm:inline">{t('exit')}</span>
          <Kbd className="hidden self-center bg-muted text-foreground lg:inline-flex">
            Alt+Q
          </Kbd>
        </Button>
      </header>

      <main className="min-h-0 flex-1">
        {isMobile ? (
          <Tabs
            value={mobileTab}
            onValueChange={(value) => setMobileTab(value as MobileTab)}
            className="flex h-full min-h-0 flex-col"
          >
            <TabsList className="h-auto w-full flex-none justify-start overflow-x-auto rounded-none border-b bg-card p-1">
              <TabsTrigger value="problem">
                <FileText />
                {t('problem')}
              </TabsTrigger>
              <TabsTrigger value="editor">
                <TerminalSquare />
                {t('editor')}
              </TabsTrigger>
              {pretestVisible && (
                <TabsTrigger value="pretest">{t('pretest')}</TabsTrigger>
              )}
              {recordsVisible && (
                <TabsTrigger value="records">{t('records')}</TabsTrigger>
              )}
              <TabsTrigger value="settings">
                <Settings />
                {t('settings')}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="problem"
              className="min-h-0 flex-1 overflow-auto p-4"
            >
              {problemStatement}
            </TabsContent>
            <TabsContent value="editor" className="min-h-0 flex-1">
              {editor}
            </TabsContent>
            {pretestVisible && (
              <TabsContent
                value="pretest"
                className="min-h-0 flex-1 overflow-auto"
              >
                {pretest}
              </TabsContent>
            )}
            {recordsVisible && (
              <TabsContent
                value="records"
                className="min-h-0 flex-1 overflow-auto"
              >
                {recordPanel}
              </TabsContent>
            )}
            <TabsContent
              value="settings"
              className="min-h-0 flex-1 overflow-auto"
            >
              {settingsPanel}
            </TabsContent>
          </Tabs>
        ) : (
          <Group orientation="horizontal" className="h-full">
            <Panel
              id="scratchpad-reference"
              defaultSize="38"
              minSize="20"
              maxSize="60"
            >
              <div className="flex h-full min-h-0 flex-col border-r bg-card/30">
                <div className="flex border-b p-1">
                  <Button
                    size="sm"
                    variant={desktopPage === 'problem' ? 'secondary' : 'ghost'}
                    onClick={() => setDesktopPage('problem')}
                    className="gap-2"
                  >
                    <FileText />
                    {t('problem')}
                  </Button>
                  <Button
                    size="sm"
                    variant={desktopPage === 'settings' ? 'secondary' : 'ghost'}
                    onClick={() => setDesktopPage('settings')}
                    className="gap-2"
                  >
                    <SlidersHorizontal />
                    {t('settings')}
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  {desktopPage === 'problem' ? (
                    <div className="p-5">{problemStatement}</div>
                  ) : (
                    settingsPanel
                  )}
                </div>
              </div>
            </Panel>
            <ResizeSeparator orientation="horizontal" />
            <Panel id="scratchpad-work" minSize="40">
              <Group orientation="vertical" className="h-full">
                <Panel id="scratchpad-editor" defaultSize="55" minSize="25">
                  <div className="h-full min-h-0">{editor}</div>
                </Panel>
                {pretestVisible && (
                  <>
                    <ResizeSeparator orientation="vertical" />
                    <Panel
                      id="scratchpad-pretest"
                      defaultSize="20"
                      minSize="15"
                    >
                      <div className="h-full min-h-0 overflow-auto border-t">
                        {pretest}
                      </div>
                    </Panel>
                  </>
                )}
                {recordsVisible && (
                  <>
                    <ResizeSeparator orientation="vertical" />
                    <Panel
                      id="scratchpad-records"
                      defaultSize="25"
                      minSize="15"
                    >
                      <div className="h-full min-h-0 overflow-auto border-t">
                        {recordPanel}
                      </div>
                    </Panel>
                  </>
                )}
              </Group>
            </Panel>
          </Group>
        )}
      </main>
    </div>
  );
}
