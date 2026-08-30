import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import ServerApis from '@/api/server/method';
import { parseProblemIdList } from '@/features/problem/problem-list-editor-utils';
import 'server-only';

export async function resolveProblemListItems(
  domainId: string,
  pids: string
): Promise<ProblemAutoCompleteItem[]> {
  const docIds = parseProblemIdList(pids);
  if (!docIds.length) return [];

  try {
    const problems = await ServerApis.Problems.getProblemsByIds(
      domainId,
      docIds
    );
    const problemsById = new Map(
      problems.map((problem) => [problem.docId, problem])
    );

    return docIds.map(
      (docId) => problemsById.get(docId) ?? { docId, title: String(docId) }
    );
  } catch {
    return docIds.map((docId) => ({ docId, title: String(docId) }));
  }
}
