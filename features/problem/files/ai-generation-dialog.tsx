'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MAX_INSTRUCTIONS_LENGTH = 10_000;

type Props = {
  domainId: string;
  pid: string;
};

type GenerationError = {
  name?: string;
  message?: string;
  code?: number;
};

function getGenerationError(error: unknown): GenerationError {
  if (!error || typeof error !== 'object') return {};
  const value = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    error?: unknown;
    response?: unknown;
  };
  const nested =
    value.error && typeof value.error === 'object'
      ? (value.error as Record<string, unknown>)
      : value.response && typeof value.response === 'object'
        ? (value.response as { error?: unknown }).error
        : undefined;
  const source: Record<string, unknown> =
    nested && typeof nested === 'object'
      ? (nested as Record<string, unknown>)
      : value;
  return {
    name: typeof source.name === 'string' ? source.name : undefined,
    message: typeof source.message === 'string' ? source.message : undefined,
    code: typeof source.code === 'number' ? source.code : undefined,
  };
}

function isErrorResponse(
  response: unknown
): response is { error: { name?: string; message?: string; code?: number } } {
  return (
    !!response &&
    typeof response === 'object' &&
    'error' in response &&
    !!response.error &&
    typeof response.error === 'object'
  );
}

export default function AiGenerationSection({ domainId, pid }: Props) {
  const t = useTranslations('problem.fileManager');
  const router = useRouter();
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (busy) return;
    const trimmed = instructions.trim();
    if (trimmed.length > MAX_INSTRUCTIONS_LENGTH) {
      setError(t('aiInstructionsTooLong'));
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = await ClientApis.Problem.generateAiTestdata({
        domainId,
        id: pid,
        instructions: trimmed || undefined,
      }).send();
      if (isErrorResponse(response)) {
        throw response;
      }
      const success = response as { rid?: string };
      if (!success.rid) throw new Error(t('aiGenerationFailed'));
      router.push(`/record/${success.rid}`);
    } catch (cause) {
      const details = getGenerationError(cause);
      if (
        details.name === 'AiGenerationDisabledError' ||
        details.code === 503
      ) {
        setError(t('aiGenerationDisabled'));
      } else if (
        details.name === 'AiGenerationAlreadyActiveError' ||
        details.code === 409
      ) {
        setError(t('aiGenerationAlreadyActive'));
      } else {
        setError(details.message || t('aiGenerationFailed'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4" data-llm-visible="true">
      <h2 className="text-xl text-primary" data-llm-text={t('generateWithAi')}>
        {t('generateWithAi')}
      </h2>
      <div className="space-y-2">
        <Label htmlFor="ai-generation-instructions">
          {t('aiInstructions')}
        </Label>
        <Textarea
          id="ai-generation-instructions"
          value={instructions}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
          disabled={busy}
          onChange={(event) => setInstructions(event.target.value)}
          placeholder={t('aiInstructionsPlaceholder')}
          className="min-h-32"
        />
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {instructions.length}/{MAX_INSTRUCTIONS_LENGTH}
        </p>
      </div>
      {error && (
        <p
          className="text-destructive text-sm"
          role="alert"
          data-llm-text={error}
        >
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="button" disabled={busy} onClick={() => void submit()}>
          <Sparkles />
          {busy ? t('generatingWithAi') : t('startGeneration')}
        </Button>
      </div>
    </section>
  );
}
