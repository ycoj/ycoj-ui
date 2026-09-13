import JSZip from 'jszip';

const REL_NS =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

type XmlReader = (path: string) => Promise<Document | null>;

// Minimal XLSX reader: extracts the first worksheet as a grid of cell text.
// Shared strings, inline strings, booleans, and plain numbers are supported;
// formulas resolve to their cached value and everything else yields ''.
export async function readXlsxTable(data: Blob | ArrayBuffer) {
  const zip = await JSZip.loadAsync(data);
  const parser = new DOMParser();
  const readXml: XmlReader = async (path) => {
    const file = zip.file(path);
    return file
      ? parser.parseFromString(await file.async('text'), 'text/xml')
      : null;
  };

  const sharedStrings: string[] = [];
  const sst = await readXml('xl/sharedStrings.xml');
  if (sst) {
    for (const si of Array.from(sst.getElementsByTagName('si'))) {
      let text = '';
      for (const t of Array.from(si.getElementsByTagName('t'))) {
        text += t.textContent ?? '';
      }
      sharedStrings.push(text);
    }
  }

  const sheetPath = await firstSheetPath(zip, readXml);
  const sheet = sheetPath ? await readXml(sheetPath) : null;
  if (!sheet) return [];

  const rows: string[][] = [];
  for (const row of Array.from(sheet.getElementsByTagName('row'))) {
    const cells: string[] = [];
    let nextColumn = 0;
    let width = 0;
    for (const cell of Array.from(row.getElementsByTagName('c'))) {
      const ref = cell.getAttribute('r') ?? '';
      const letters = ref.match(/^[A-Z]+/i)?.[0];
      const column = letters ? columnIndex(letters) : nextColumn;
      cells[column] = cellText(cell, sharedStrings);
      nextColumn = column + 1;
      width = Math.max(width, nextColumn);
    }
    rows.push(Array.from({ length: width }, (_, i) => cells[i] ?? ''));
  }
  return rows;
}

function columnIndex(letters: string): number {
  let index = 0;
  for (const char of letters.toUpperCase()) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index - 1;
}

function cellText(cell: Element, sharedStrings: string[]): string {
  const type = cell.getAttribute('t');
  const value = cell.getElementsByTagName('v')[0]?.textContent ?? '';
  if (type === 's') return sharedStrings[Number(value)] ?? '';
  if (type === 'b') return value === '1' ? 'TRUE' : 'FALSE';
  if (type === 'inlineStr') {
    let text = '';
    for (const t of Array.from(cell.getElementsByTagName('t'))) {
      text += t.textContent ?? '';
    }
    return text;
  }
  return type === 'e' ? '' : value;
}

async function firstSheetPath(zip: JSZip, readXml: XmlReader) {
  const workbook = await readXml('xl/workbook.xml');
  const sheet = workbook?.getElementsByTagName('sheet')[0];
  const relId =
    sheet?.getAttributeNS(REL_NS, 'id') ?? sheet?.getAttribute('r:id');
  if (relId) {
    const rels = await readXml('xl/_rels/workbook.xml.rels');
    for (const rel of Array.from(
      rels?.getElementsByTagName('Relationship') ?? []
    )) {
      if (rel.getAttribute('Id') !== relId) continue;
      const target = rel.getAttribute('Target') ?? '';
      if (target) {
        return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
      }
    }
  }
  return (
    zip
      .file(/^xl\/worksheets\/[^/]+\.xml$/)
      .map((file) => file.name)
      .sort()[0] ?? null
  );
}
