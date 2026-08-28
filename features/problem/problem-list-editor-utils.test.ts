import {
  appendUniqueProblems,
  parseProblemIdList,
  problemListLabel,
  reorderItems,
  serializeProblemIds,
} from './problem-list-editor-utils';
import { describe, expect, it } from 'vitest';

const tree = { docId: 1000, pid: 'P1000', title: 'Binary Tree' };
const graph = { docId: 1001, title: 'Graph' };
const flow = { docId: 1002, pid: 'P1002', title: 'Network Flow' };

describe('problem list editor utilities', () => {
  it('serializes problem doc IDs in list order', () => {
    expect(serializeProblemIds([tree, graph, flow])).toBe('1000,1001,1002');
    expect(serializeProblemIds([])).toBe('');
  });

  it('parses unique numeric IDs from mixed separators', () => {
    expect(parseProblemIdList('1000， 1001,1001 1002')).toEqual([
      1000, 1001, 1002,
    ]);
    expect(parseProblemIdList('abc, 12a, ,')).toEqual([]);
    expect(parseProblemIdList('1,9007199254740991,9007199254740993,2')).toEqual(
      [1, 9007199254740991, 2]
    );
  });

  it('appends incoming problems that are not already present', () => {
    expect(appendUniqueProblems([tree], [tree, graph, graph])).toEqual([
      tree,
      graph,
    ]);
  });

  it('reorders items and ignores out-of-range indexes', () => {
    expect(reorderItems([tree, graph, flow], 0, 2)).toEqual([
      graph,
      flow,
      tree,
    ]);
    expect(reorderItems([tree, graph], 0, 0)).toEqual([tree, graph]);
    expect(reorderItems([tree, graph], -1, 1)).toEqual([tree, graph]);
    expect(reorderItems([tree, graph], 0, 5)).toEqual([tree, graph]);
  });

  it('formats list labels from pid or numeric id', () => {
    expect(problemListLabel(tree)).toBe('P1000. Binary Tree');
    expect(problemListLabel(graph)).toBe('#1001. Graph');
  });
});
