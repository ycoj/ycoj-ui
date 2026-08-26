export function formatProblemPid(problem: {
  pid?: string;
  docId: number;
}): string {
  return problem.pid || `P${problem.docId}`;
}
