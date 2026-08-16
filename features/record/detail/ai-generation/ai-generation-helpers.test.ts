import { parseShellCommandNames } from './ai-generation-helpers';
import { describe, expect, it } from 'vitest';

describe('parseShellCommandNames', () => {
  it('extracts a single command name', () => {
    expect(parseShellCommandNames('ls ./')).toEqual(['ls']);
  });

  it('extracts each command in a pipeline', () => {
    expect(
      parseShellCommandNames(
        "find . -maxdepth 2 -type f | sort | sed -n '1,200p'"
      )
    ).toEqual(['find', 'sort', 'sed']);
  });

  it('splits on &&, ||, semicolons and newlines', () => {
    expect(
      parseShellCommandNames('cd a && pnpm lint || echo fail; git status\npwd')
    ).toEqual(['cd', 'pnpm', 'echo', 'git', 'pwd']);
  });

  it('skips environment variable assignments', () => {
    expect(
      parseShellCommandNames('FOO=bar NODE_ENV=test node build.js')
    ).toEqual(['node']);
  });

  it('strips path prefixes and leading parentheses', () => {
    expect(parseShellCommandNames('/usr/bin/node ./scripts/build.js')).toEqual([
      'node',
    ]);
    expect(parseShellCommandNames('(ls -la)')).toEqual(['ls']);
  });

  it('deduplicates repeated command names', () => {
    expect(parseShellCommandNames('grep a | grep b | sort')).toEqual([
      'grep',
      'sort',
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(parseShellCommandNames('')).toEqual([]);
    expect(parseShellCommandNames('   ')).toEqual([]);
  });

  it('ignores heredoc bodies', () => {
    expect(
      parseShellCommandNames('cat <<EOF | wc -l\nhello | world\nEOF\nls')
    ).toEqual(['cat', 'wc', 'ls']);
  });

  it('supports quoted and indented heredoc delimiters', () => {
    expect(
      parseShellCommandNames("python3 <<-'PY'\n  print(1)\n\tPY\necho done")
    ).toEqual(['python3', 'echo']);
    expect(parseShellCommandNames("cat <<'END'\nENDish\nEND")).toEqual(['cat']);
  });

  it('handles multiple heredocs on one line in order', () => {
    expect(
      parseShellCommandNames('cat <<A; cat <<B\nbody a\nA\nbody b\nB\npwd')
    ).toEqual(['cat', 'pwd']);
  });
});
