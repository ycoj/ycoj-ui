export type UserImportRow = {
  id: string;
  email: string;
  username: string;
  password: string;
  displayName: string;
  group: string;
  school: string;
  studentId: string;
  // Unrecognized keys from an imported extra-details JSON object, kept so
  // re-serializing the row does not silently drop them.
  extra: Record<string, unknown>;
};

let rowSequence = 0;

export function newRowId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  rowSequence += 1;
  return `row-${Date.now().toString(36)}-${rowSequence}`;
}

export function emptyRow(): UserImportRow {
  return {
    id: newRowId(),
    email: '',
    username: '',
    password: '',
    displayName: '',
    group: '',
    school: '',
    studentId: '',
    extra: {},
  };
}

export function isRowEmpty(row: UserImportRow): boolean {
  return (
    !row.email.trim() &&
    !row.username.trim() &&
    !row.password.trim() &&
    !row.displayName.trim() &&
    !row.group.trim() &&
    !row.school.trim() &&
    !row.studentId.trim() &&
    Object.keys(row.extra).length === 0
  );
}

export function rowNeedsFields(row: UserImportRow): boolean {
  return !row.email.trim() || !row.username.trim() || !row.password.trim();
}

// Line numbers in backend messages count the submitted lines, which are the
// non-empty rows in order. Returns the 1-based line number per row, or null
// for rows that are dropped before serialization.
export function rowLineNumbers(rows: UserImportRow[]): (number | null)[] {
  let line = 0;
  return rows.map((row) => (isRowEmpty(row) ? null : ++line));
}

// Cells must stay single-line and tab-free so the TSV payload stays intact.
function sanitizeCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ').trim();
}

// Mirrors the backend: the line is tab-split first, and when any required
// cell comes out empty it is retried with commas and that result is used
// unconditionally (this also covers single-column lines, where the comma
// split is identical).
export function splitRowLine(line: string): {
  cells: string[];
  tabbed: boolean;
} {
  const cells = line.split('\t').map(sanitizeCell);
  if (cells[0] && cells[1] && cells[2]) return { cells, tabbed: true };
  return { cells: line.split(',').map(sanitizeCell), tabbed: false };
}

function parseExtra(cell: string, row: UserImportRow) {
  if (!cell) return;
  try {
    const parsed: unknown = JSON.parse(cell);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = { ...(parsed as Record<string, unknown>) };
      for (const key of ['group', 'school', 'studentId'] as const) {
        const value = record[key];
        if (typeof value === 'string' && value) row[key] = value;
        delete record[key];
      }
      row.extra = record;
      return;
    }
  } catch {
    // Not JSON: treat the column as a plain group name.
  }
  row.group = cell;
}

// Positional columns: email, username, password, display name, extra details.
// A single column is treated as a username list unless it looks like emails.
// Tab-split cells (TSV text, spreadsheet grids) keep extra columns positional:
// group, school, student ID, then one last JSON extra object. Comma-split
// cells follow the backend and join everything after the display name into a
// single extra-details value.
export function cellsToRow(
  cells: string[],
  { tabbed = false }: { tabbed?: boolean } = {}
): UserImportRow {
  const row = emptyRow();
  if (cells.length === 1) {
    if (cells[0].includes('@')) row.email = cells[0];
    else row.username = cells[0];
    return row;
  }
  row.email = cells[0] ?? '';
  row.username = cells[1] ?? '';
  row.password = cells[2] ?? '';
  row.displayName = cells[3] ?? '';
  if (!tabbed) {
    parseExtra(cells.slice(4).join(','), row);
    return row;
  }
  parseExtra(cells[4] ?? '', row);
  // Positional values win over keys coming from the extra JSON object.
  if (cells[5]) row.school = cells[5];
  if (cells[6]) row.studentId = cells[6];
  const tail = cells.slice(7).join(',');
  if (tail) {
    try {
      const parsed: unknown = JSON.parse(tail);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        row.extra = { ...row.extra, ...(parsed as Record<string, unknown>) };
      }
    } catch {
      // A non-JSON tail is ignored, like the backend does for bad extras.
    }
  }
  return row;
}

export function parseUsersText(text: string): UserImportRow[] {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const { cells, tabbed } = splitRowLine(line);
      return cellsToRow(cells, { tabbed });
    });
}

export function tableToRows(table: string[][]): UserImportRow[] {
  return table
    .map((cells) => cells.map((cell) => sanitizeCell(cell ?? '')))
    .filter((cells) => cells.some((cell) => cell))
    .map((cells) => cellsToRow(cells, { tabbed: true }));
}

function serializeExtra(row: UserImportRow): string {
  const extra = { ...row.extra };
  const group = sanitizeCell(row.group);
  const school = sanitizeCell(row.school);
  const studentId = sanitizeCell(row.studentId);
  if (group) extra.group = group;
  if (school) extra.school = school;
  if (studentId) extra.studentId = studentId;
  return Object.keys(extra).length ? JSON.stringify(extra) : '';
}

export function rowsToSource(rows: UserImportRow[]): string {
  return rows
    .filter((row) => !isRowEmpty(row))
    .map((row) => {
      const cells = [
        sanitizeCell(row.email),
        sanitizeCell(row.username),
        sanitizeCell(row.password),
        sanitizeCell(row.displayName),
        serializeExtra(row),
      ];
      while (cells.length > 3 && !cells[cells.length - 1]) cells.pop();
      return cells.join('\t');
    })
    .join('\n');
}

const GENERATED_EMAIL_DOMAIN = 'ycoj.local';

export function generatedEmail(username: string): string {
  return `${username}@${GENERATED_EMAIL_DOMAIN}`;
}

export type UsernamePattern = {
  prefix: string;
  start: number;
  count: number;
  digits: number;
};

export function generateUsernames(pattern: UsernamePattern): string[] {
  const { prefix, start, count, digits } = pattern;
  return Array.from(
    { length: count },
    (_, index) => `${prefix}${String(start + index).padStart(digits, '0')}`
  );
}

const PASSWORD_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
const PASSWORD_DIGITS = '23456789';
const PASSWORD_SYMBOLS = '!@#$%^&*()-_=+';

export function randomPassword(length: number, symbols: boolean): string {
  const alphabet =
    PASSWORD_LETTERS + PASSWORD_DIGITS + (symbols ? PASSWORD_SYMBOLS : '');
  // Rejection sampling keeps every character equally likely.
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  const output: string[] = [];
  while (output.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte < limit) output.push(alphabet[byte % alphabet.length]);
      if (output.length === length) break;
    }
  }
  return output.join('');
}
