'server-only';

import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import ServerApis from '@/api/server/method';
import { parseProblemIdList } from '@/features/problem/problem-list-editor-utils';

export async function resolveProblemListItems(
  pids: string
): Promise<ProblemAutoCompleteItem[]> {
  const docIds = parseProblemIdList(pids);
  return Promise.all(
    docIds.map(async (docId) => {
      try {
        const data = await ServerApis.Problems.getProblemsList(String(docId));
        const found = data.pdocs?.find((problem) => problem.docId === docId);
        if (found) {
          return {
            docId: found.docId,
            pid: found.pid,
            title: found.title,
          };
        }
      } catch {
        // Fall back to the numeric id when lookup fails.
      }
      return { docId, title: String(docId) };
    })
  );
}
