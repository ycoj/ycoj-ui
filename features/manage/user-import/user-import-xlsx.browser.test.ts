import { readXlsxTable } from './user-import-xlsx';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

async function buildXlsx(files: Record<string, string>) {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'arraybuffer' });
}

const workbook = `<?xml version="1.0"?>
<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Users" sheetId="1" r:id="rId2"/>
  </sheets>
</workbook>`;

const rels = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="style" Target="styles.xml"/>
  <Relationship Id="rId2" Type="worksheet" Target="worksheets/sheet7.xml"/>
</Relationships>`;

const sharedStrings = `<?xml version="1.0"?>
<sst><si><t>a@example.com</t></si><si><r><t>ali</t><t>ce</t></r></si></sst>`;

const sheet = `<?xml version="1.0"?>
<worksheet><sheetData>
  <row r="1">
    <c r="A1" t="s"><v>0</v></c>
    <c r="B1" t="s"><v>1</v></c>
    <c r="C1"><v>12345</v></c>
    <c r="E1" t="inlineStr"><is><t>Class A</t></is></c>
    <c r="F1" t="b"><v>1</v></c>
  </row>
  <row r="3">
    <c t="s"><v>1</v></c>
    <c t="str"><v>cached</v></c>
    <c t="e"><v>#DIV/0!</v></c>
  </row>
</sheetData></worksheet>`;

describe('readXlsxTable', () => {
  it('resolves the first sheet through workbook rels and reads all cell types', async () => {
    const data = await buildXlsx({
      'xl/workbook.xml': workbook,
      'xl/_rels/workbook.xml.rels': rels,
      'xl/sharedStrings.xml': sharedStrings,
      'xl/worksheets/sheet7.xml': sheet,
    });
    const rows = await readXlsxTable(data);
    expect(rows).toEqual([
      ['a@example.com', 'alice', '12345', '', 'Class A', 'TRUE'],
      ['alice', 'cached', ''],
    ]);
  });

  it('falls back to the first worksheet file when rels are missing', async () => {
    const data = await buildXlsx({
      'xl/worksheets/sheet1.xml': sheet,
    });
    const rows = await readXlsxTable(data);
    expect(rows[0][0]).toBe('');
    expect(rows[0][2]).toBe('12345');
  });
});
