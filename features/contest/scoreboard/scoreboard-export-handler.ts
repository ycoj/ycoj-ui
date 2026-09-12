import {
  ScoreboardExportBusyError,
  ScoreboardExportLimitError,
} from './scoreboard-export-errors';
import { renderScoreboardFile } from './scoreboard-export-renderer';
import ServerApis from '@/api/server/method';
import { STATUS_TEXT_KEYS } from '@/shared/configs/status';
import { backendErrorStatus } from '@/shared/lib/backend-response';
import { getTranslations } from 'next-intl/server';
import 'server-only';
import { z } from 'zod';

const flag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
const requestSchema = z.object({
  pageType: z.enum(['contest', 'homework']),
  tid: z.string().regex(/^[a-f\d]{24}$/i),
  avatar: flag,
  realName: flag,
  details: flag,
});
const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };

function isAbortError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string' &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}

export async function handleScoreboardExport(
  request: Request,
  params: { pageType: string; tid: string }
) {
  const query = new URL(request.url).searchParams;
  const parsed = requestSchema.safeParse({
    ...params,
    avatar: query.get('avatar') ?? undefined,
    realName: query.get('realName') ?? undefined,
    details: query.get('details') ?? undefined,
  });
  if (!parsed.success)
    return Response.json(
      { error: 'Invalid export options' },
      { status: 400, headers: privateHeaders }
    );
  const { pageType, tid, ...options } = parsed.data;
  const t = await getTranslations('scoreboard');
  try {
    const data = await ServerApis.Contests.getScoreboardExportData(
      pageType,
      tid,
      options
    );
    if ('error' in data)
      return Response.json(
        { error: data.error.message },
        {
          status: backendErrorStatus(data.error.name),
          headers: privateHeaders,
        }
      );
    const statusT = await getTranslations('judgeStatus.label');
    const file = await renderScoreboardFile(
      data,
      options,
      {
        details: t('submissionDetails'),
        noSubmissions: t('noUserSubmissions'),
        columns: [
          'submissionId',
          'problem',
          'submittedAt',
          'status',
          'score',
          'language',
        ].map((key) => t(key)),
        statuses: Object.fromEntries(
          Object.values(STATUS_TEXT_KEYS).map((key) => [key, statusT(key)])
        ),
      },
      request.signal
    );
    return new Response(new Uint8Array(file.body), {
      headers: {
        ...privateHeaders,
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="scoreboard.${options.details ? 'zip' : 'png'}"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof ScoreboardExportLimitError)
      return Response.json(
        { error: t('exportLimitExceeded') },
        { status: 413, headers: privateHeaders }
      );
    if (error instanceof ScoreboardExportBusyError)
      return Response.json(
        { error: t('exportBusy') },
        {
          status: 503,
          headers: { ...privateHeaders, 'Retry-After': '60' },
        }
      );
    console.error('Scoreboard export failed', error);
    return Response.json(
      { error: t('exportFailed') },
      { status: isAbortError(error) ? 504 : 500, headers: privateHeaders }
    );
  }
}
