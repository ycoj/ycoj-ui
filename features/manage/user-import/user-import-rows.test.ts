import {
  cellsToRow,
  emptyRow,
  generateUsernames,
  parseUsersText,
  randomPassword,
  rowLineNumbers,
  rowsToCsv,
  rowsToSource,
  tableToRows,
  type UserImportRow,
} from './user-import-rows';
import { describe, expect, it } from 'vitest';

function row(partial: Partial<UserImportRow>): UserImportRow {
  return { ...emptyRow(), ...partial };
}

describe('parseUsersText', () => {
  it('parses tab and comma separated lines with positional columns', () => {
    const rows = parseUsersText(
      'a@example.com\talice\tpw1\tAlice\t{"group":"A"}\r\nb@example.com,bob,pw2'
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      email: 'a@example.com',
      username: 'alice',
      password: 'pw1',
      displayName: 'Alice',
      group: 'A',
    });
    expect(rows[1]).toMatchObject({
      email: 'b@example.com',
      username: 'bob',
      password: 'pw2',
      displayName: '',
    });
  });

  it('strips a BOM and skips blank lines', () => {
    const rows = parseUsersText('﻿\n\nx@example.com\tx\tp\n  \n');
    expect(rows).toHaveLength(1);
    expect(rows[0].username).toBe('x');
  });

  it('treats a single column as usernames, or emails when it contains @', () => {
    const rows = parseUsersText('student1\nadmin@example.com');
    expect(rows[0]).toMatchObject({ username: 'student1', email: '' });
    expect(rows[1]).toMatchObject({ email: 'admin@example.com', username: '' });
  });

  it('maps a non-JSON extra column to the group and preserves unknown JSON keys', () => {
    const [plain] = parseUsersText('a@b.c\tu\tp\tName\tClass A');
    expect(plain.group).toBe('Class A');
    const [json] = parseUsersText(
      'a@b.c\tu\tp\tName\t{"group":"G","note":"keep me"}'
    );
    expect(json.group).toBe('G');
    expect(json.extra).toEqual({ note: 'keep me' });
  });
});

describe('rowsToSource', () => {
  it('serializes non-empty rows as tab-separated lines', () => {
    const source = rowsToSource([
      row({ email: 'a@b.c', username: 'alice', password: 'pw' }),
      emptyRow(),
      row({
        email: 'c@d.e',
        username: 'bob',
        password: 'pw2',
        displayName: 'Bob',
        group: 'A',
        studentId: '001',
        extra: { note: 'x' },
      }),
    ]);
    expect(source).toBe(
      'a@b.c\talice\tpw\n' +
        'c@d.e\tbob\tpw2\tBob\t{"note":"x","group":"A","studentId":"001"}'
    );
  });

  it('keeps the display name column empty when only extra details are set', () => {
    const source = rowsToSource([
      row({ email: 'a@b.c', username: 'u', password: 'p', group: 'G' }),
    ]);
    expect(source).toBe('a@b.c\tu\tp\t\t{"group":"G"}');
  });

  it('sanitizes tabs and newlines inside cells', () => {
    const source = rowsToSource([
      row({
        email: 'a@b.c',
        username: 'we\tird',
        password: 'p\nw',
        displayName: 'A\tB',
      }),
    ]);
    expect(source).toBe('a@b.c\twe ird\tp w\tA B');
  });
});

describe('rowLineNumbers', () => {
  it('assigns line numbers only to non-empty rows', () => {
    const numbers = rowLineNumbers([
      row({ username: 'a' }),
      emptyRow(),
      row({ email: 'b@c.d' }),
    ]);
    expect(numbers).toEqual([1, null, 2]);
  });
});

describe('generateUsernames', () => {
  it('builds prefix plus padded running numbers', () => {
    expect(
      generateUsernames({ prefix: 'team', start: 7, count: 3, digits: 3 })
    ).toEqual(['team007', 'team008', 'team009']);
    expect(
      generateUsernames({ prefix: 'u', start: 98, count: 3, digits: 2 })
    ).toEqual(['u98', 'u99', 'u100']);
  });
});

describe('randomPassword', () => {
  it('produces passwords of the requested length from the expected alphabet', () => {
    const plain = randomPassword(24, false);
    expect(plain).toHaveLength(24);
    expect(plain).toMatch(/^[A-Za-z2-9]+$/);
    const withSymbols = randomPassword(64, true);
    expect(withSymbols).toHaveLength(64);
    expect(withSymbols).toMatch(/^[A-Za-z2-9!@#$%^&*()\-_=+]+$/);
  });
});

describe('tableToRows / rowsToCsv', () => {
  it('maps a cell grid into rows and drops empty grid lines', () => {
    const rows = tableToRows([
      ['a@b.c', 'alice', 'pw', '', 'G'],
      ['', ''],
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: 'a@b.c', username: 'alice' });
    expect(rows[0].group).toBe('G');
  });

  it('exports a quoted CSV snapshot of the table', () => {
    const csv = rowsToCsv([
      row({
        email: 'a@b.c',
        username: 'al,ice',
        password: 'p"w',
        group: 'G',
      }),
    ]);
    expect(csv).toBe(
      'email,username,password,displayName,group,school,studentId,extra\n' +
        '"a@b.c","al,ice","p""w","","G","","",""'
    );
  });
});

describe('isRowEmpty / cellsToRow', () => {
  it('round-trips a fully populated row', () => {
    const parsed = cellsToRow([
      'e@x.y',
      'user',
      'pass',
      'Name',
      '{"group":"G","school":"S","studentId":"1","other":2}',
    ]);
    expect(parsed).toMatchObject({
      email: 'e@x.y',
      username: 'user',
      password: 'pass',
      displayName: 'Name',
      group: 'G',
      school: 'S',
      studentId: '1',
    });
    expect(parsed.extra).toEqual({ other: 2 });
    expect(rowsToSource([parsed])).toBe(
      'e@x.y\tuser\tpass\tName\t{"other":2,"group":"G","school":"S","studentId":"1"}'
    );
  });
});
