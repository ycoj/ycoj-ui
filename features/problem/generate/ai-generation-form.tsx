'use client';

import ClientApis from '@/api/client/method';
import CodeEditor from '@/shared/components/code/code-editor';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import type { AiGenerationOptions } from '@/shared/types/ai-generation';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MAX_TEXT_LENGTH = 10_000;
const MAX_SOURCE_LENGTH = 100_000;

type CheckerMode = 'provided' | 'generated';

type Props = {
  pid: string;
  options: AiGenerationOptions;
};

export default function AiGenerationForm({ pid, options }: Props) {
  const t = useTranslations('problem.aiGenerationForm');
  const router = useRouter();
  const [profileId, setProfileId] = useState(options.defaultProfileId);
  const [testcaseTarget, setTestcaseTarget] = useState(
    String(options.defaultTarget)
  );
  const [timeLimitMs, setTimeLimitMs] = useState(String(options.timeLimitMs));
  const [memoryLimitMb, setMemoryLimitMb] = useState(
    String(options.memoryLimitMb)
  );
  const [instructions, setInstructions] = useState('');
  const [includeStandardSolution, setIncludeStandardSolution] = useState(false);
  const [standardSolution, setStandardSolution] = useState('');
  const [includeChecker, setIncludeChecker] = useState(false);
  const [checkerMode, setCheckerMode] = useState<CheckerMode>('generated');
  const [checkerSource, setCheckerSource] = useState('');
  const [checkerRequirements, setCheckerRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const maxTarget = includeChecker
    ? options.maxWithChecker
    : options.maxWithoutChecker;
  const unavailable =
    !options.enabled || options.profiles.length === 0 || maxTarget < 1;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || unavailable) return;
    const target = Number(testcaseTarget);
    const time = Number(timeLimitMs);
    const memory = Number(memoryLimitMb);
    if (!profileId) return setError(t('selectModel'));
    if (!Number.isSafeInteger(target) || target < 1 || target > maxTarget)
      return setError(t('invalidTarget', { max: maxTarget }));
    if (!Number.isSafeInteger(time) || time < 1)
      return setError(t('invalidTime'));
    if (!Number.isSafeInteger(memory) || memory < 1)
      return setError(t('invalidMemory'));
    if (includeStandardSolution && !standardSolution.trim())
      return setError(t('standardSolutionRequired'));
    if (includeStandardSolution && standardSolution.length > MAX_SOURCE_LENGTH)
      return setError(t('sourceTooLong'));
    if (includeChecker && checkerMode === 'provided' && !checkerSource.trim())
      return setError(t('checkerSourceRequired'));
    if (
      includeChecker &&
      checkerMode === 'generated' &&
      !checkerRequirements.trim()
    )
      return setError(t('checkerRequirementsRequired'));
    if (
      includeChecker &&
      checkerMode === 'provided' &&
      checkerSource.length > MAX_SOURCE_LENGTH
    )
      return setError(t('sourceTooLong'));
    if (
      instructions.length > MAX_TEXT_LENGTH ||
      checkerRequirements.length > MAX_TEXT_LENGTH
    )
      return setError(t('instructionsTooLong'));

    setSubmitting(true);
    setError('');
    try {
      const response = await ClientApis.Problem.generateAiTestdata(pid, {
        profileId,
        testcaseTarget: target,
        timeLimitMs: time,
        memoryLimitMb: memory,
        instructions: instructions.trim() || undefined,
        standardSolution: includeStandardSolution
          ? { source: standardSolution }
          : undefined,
        checker: includeChecker
          ? checkerMode === 'provided'
            ? { mode: 'provided', source: checkerSource }
            : {
                mode: 'generated',
                requirements: checkerRequirements.trim(),
              }
          : undefined,
      }).send();
      if ('error' in response) {
        setError(parseErrorMessage(response.error));
        return;
      }
      router.push(`/record/${response.rid}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => void submit(event)}
      data-llm-visible="true"
    >
      {!options.enabled && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{t('disabled')}</AlertTitle>
          <AlertDescription>{t('disabledDescription')}</AlertDescription>
        </Alert>
      )}
      {options.enabled && options.profiles.length === 0 && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{t('noModels')}</AlertTitle>
          <AlertDescription>{t('noModelsDescription')}</AlertDescription>
        </Alert>
      )}
      <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangle />
        <AlertTitle>{t('replacementWarning')}</AlertTitle>
        <AlertDescription>{t('replacementDescription')}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t('generationSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="generation-model">{t('model')}</Label>
            <Select
              value={profileId}
              onValueChange={setProfileId}
              disabled={submitting || unavailable}
            >
              <SelectTrigger id="generation-model" className="w-full">
                <SelectValue placeholder={t('selectModel')} />
              </SelectTrigger>
              <SelectContent>
                {options.profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.label} ({profile.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="testcase-target">{t('testcaseTarget')}</Label>
            <Input
              id="testcase-target"
              type="number"
              min={1}
              max={maxTarget}
              value={testcaseTarget}
              disabled={submitting || unavailable}
              onChange={(event) => setTestcaseTarget(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time-limit">{t('timeLimit')}</Label>
            <Input
              id="time-limit"
              type="number"
              min={1}
              value={timeLimitMs}
              disabled={submitting || unavailable}
              onChange={(event) => setTimeLimitMs(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memory-limit">{t('memoryLimit')}</Label>
            <Input
              id="memory-limit"
              type="number"
              min={1}
              value={memoryLimitMb}
              disabled={submitting || unavailable}
              onChange={(event) => setMemoryLimitMb(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('standardSolution')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-standard-solution"
              className="cursor-pointer"
              checked={includeStandardSolution}
              disabled={submitting || unavailable}
              onCheckedChange={(checked) =>
                setIncludeStandardSolution(checked === true)
              }
            />
            <Label
              htmlFor="include-standard-solution"
              className="cursor-pointer"
            >
              {t('provideStandardSolution')}
            </Label>
          </div>
          {includeStandardSolution && (
            <CodeEditor
              value={standardSolution}
              onChange={setStandardSolution}
              language="cpp"
              path="provided-standard-solution.cc"
              height="320px"
              readOnly={submitting}
              ariaLabel={t('standardSolutionCode')}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('specialJudge')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-checker"
              className="cursor-pointer"
              checked={includeChecker}
              disabled={submitting || unavailable}
              onCheckedChange={(checked) => setIncludeChecker(checked === true)}
            />
            <Label htmlFor="include-checker" className="cursor-pointer">
              {t('useSpecialJudge')}
            </Label>
          </div>
          {includeChecker && (
            <>
              <div className="space-y-2">
                <Label htmlFor="checker-mode">{t('checkerMode')}</Label>
                <Select
                  value={checkerMode}
                  onValueChange={(value) =>
                    setCheckerMode(value as CheckerMode)
                  }
                  disabled={submitting}
                >
                  <SelectTrigger id="checker-mode" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generated">
                      {t('generateChecker')}
                    </SelectItem>
                    <SelectItem value="provided">
                      {t('provideChecker')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {checkerMode === 'provided' ? (
                <CodeEditor
                  value={checkerSource}
                  onChange={setCheckerSource}
                  language="cpp"
                  path="checker.cc"
                  height="320px"
                  readOnly={submitting}
                  ariaLabel={t('checkerSource')}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="checker-requirements">
                    {t('checkerRequirements')}
                  </Label>
                  <Textarea
                    id="checker-requirements"
                    value={checkerRequirements}
                    maxLength={MAX_TEXT_LENGTH}
                    disabled={submitting}
                    className="min-h-32"
                    placeholder={t('checkerRequirementsPlaceholder')}
                    onChange={(event) =>
                      setCheckerRequirements(event.target.value)
                    }
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('additionalInstructions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            id="generation-instructions"
            value={instructions}
            maxLength={MAX_TEXT_LENGTH}
            disabled={submitting || unavailable}
            className="min-h-36"
            placeholder={t('instructionsPlaceholder')}
            onChange={(event) => setInstructions(event.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground tabular-nums">
            {instructions.length}/{MAX_TEXT_LENGTH}
          </p>
        </CardContent>
      </Card>

      {error && (
        <p
          className="text-sm text-destructive"
          role="alert"
          data-llm-text={error}
        >
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting || unavailable}>
          <Sparkles />
          {submitting ? t('starting') : t('start')}
        </Button>
      </div>
    </form>
  );
}
