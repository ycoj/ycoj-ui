import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import ServerApis from '@/api/server/method';
import { parseProblemIdList } from '@/features/problem/problem-list-editor-utils';
import 'server-only';

export async function resolveProblemListItems(
  pids: string
): Promise<ProblemAutoCompleteItem[]> {
  const docIds = parseProblemIdList(pids);
  if (docIds.length === 0) return [];
  const uniqueDocIds = Array.from(new Set(docIds));
  let byDocId = new Map<number, ProblemAutoCompleteItem>();
  try {
    const data = await ServerApis.Problems.getProblemsList(
      uniqueDocIds.join(',')
    );
    byDocId = new Map(
      (data.pdocs ?? []).map((problem) => [
        problem.docId,
        {
          docId: problem.docId,
          pid: problem.pid,
          title: problem.title,
        },
      ])
    );
  } catch {
    // Fall back to numeric ids when lookup fails.
  }
  return docIds.map(
    (docId) => byDocId.get(docId) ?? { docId, title: String(docId) }
  );
}
