import {
  cellsToRow,
  emptyRow,
  generateUsernames,
  parseUsersText,
  randomPassword,
  rowLineNumbers,
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

  it('splits lines ending with a lone carriage return', () => {
    const rows = parseUsersText('a@b.c\tu\tp\rc@d.e\tu2\tp2');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ email: 'c@d.e', username: 'u2' });
  });

  it('retries a mixed line with commas like the backend when the tab split is short', () => {
    // 'a@b.c\tname,pw' tab-splits into two cells, so the backend retries with
    // commas and 'pw' becomes the username instead of part of the password.
    const [row] = parseUsersText('a@b.c\tname,pw');
    expect(row).toMatchObject({
      email: 'a@b.c name',
      username: 'pw',
      password: '',
    });
  });

  it('keeps commas inside cells when the tab split already fills the required columns', () => {
    const [row] = parseUsersText('a@b.c\tu\tp,art');
    expect(row).toMatchObject({ username: 'u', password: 'p,art' });
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

  it('maps tabbed columns past the extra column to group, school, and student ID', () => {
    const [row] = parseUsersText('a@b.c\tu\tp\tName\tClass A\tSchool X\t001');
    expect(row).toMatchObject({
      group: 'Class A',
      school: 'School X',
      studentId: '001',
    });
    expect(row.extra).toEqual({});
  });

  it('lets positional school and student ID columns win over extra JSON keys', () => {
    const [row] = parseUsersText(
      'a@b.c\tu\tp\tName\t{"group":"G","school":"Json S","note":"n"}\tReal S\tID7\t{"more":1}'
    );
    expect(row).toMatchObject({
      group: 'G',
      school: 'Real S',
      studentId: 'ID7',
    });
    expect(row.extra).toEqual({ note: 'n', more: 1 });
  });

  it('ignores a non-JSON column past student ID in tabbed input', () => {
    const [row] = parseUsersText('a@b.c\tu\tp\tName\tG\tS\t1\tnot json');
    expect(row).toMatchObject({ group: 'G', school: 'S', studentId: '1' });
    expect(row.extra).toEqual({});
  });

  it('joins everything after the display name as the extra column for comma input', () => {
    const [json] = parseUsersText('a@b.c,u,p,Name,{"group":"G","note":"kept"}');
    expect(json.group).toBe('G');
    expect(json.extra).toEqual({ note: 'kept' });
    const [plain] = parseUsersText('a@b.c,u,p,Name,G,S');
    expect(plain.group).toBe('G,S');
    expect(plain.school).toBe('');
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

  it('trims every cell, including the password, like the backend does', () => {
    const source = rowsToSource([
      row({
        email: 'a@b.c',
        username: 'u',
        password: '  spaced  ',
        group: '  ',
      }),
    ]);
    expect(source).toBe('a@b.c\tu\tspaced');
  });

  it('round-trips rows through parseUsersText', () => {
    const original = [
      row({ email: 'a@b.c', username: 'alice', password: 'pw' }),
      row({
        email: 'c@d.e',
        username: 'bob',
        password: 'pw2',
        displayName: 'Bob',
        group: 'A',
        school: 'School X',
        studentId: '001',
        extra: { note: 'x' },
      }),
    ];
    const parsed = parseUsersText(rowsToSource(original));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      email: 'a@b.c',
      username: 'alice',
      password: 'pw',
    });
    expect(parsed[1]).toMatchObject({
      email: 'c@d.e',
      username: 'bob',
      password: 'pw2',
      displayName: 'Bob',
      group: 'A',
      school: 'School X',
      studentId: '001',
    });
    expect(parsed[1].extra).toEqual({ note: 'x' });
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

describe('tableToRows', () => {
  it('maps a cell grid into rows and drops empty grid lines', () => {
    const rows = tableToRows([
      ['a@b.c', 'alice', 'pw', '', 'G'],
      ['', ''],
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: 'a@b.c', username: 'alice' });
    expect(rows[0].group).toBe('G');
  });

  it('reads grid columns past the extra column as school and student ID', () => {
    const rows = tableToRows([
      ['a@b.c', 'alice', 'pw', 'Alice', 'G', 'School X', '001'],
    ]);
    expect(rows[0]).toMatchObject({
      group: 'G',
      school: 'School X',
      studentId: '001',
    });
  });
});

describe('isRowEmpty / cellsToRow', () => {
  it('round-trips a fully populated row', () => {
    const parsed = cellsToRow(
      [
        'e@x.y',
        'user',
        'pass',
        'Name',
        '{"group":"G","school":"S","studentId":"1","other":2}',
      ],
      { tabbed: true }
    );
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
