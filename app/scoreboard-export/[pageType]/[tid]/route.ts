import { handleScoreboardExport } from '@/features/contest/scoreboard/scoreboard-export-handler';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageType: string; tid: string }> }
) {
  return handleScoreboardExport(request, await params);
}
