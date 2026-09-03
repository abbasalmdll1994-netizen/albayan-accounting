const assert = require('node:assert/strict');
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const zlib = require('node:zlib');
const api = require('./material-import.js');
// Use a real XML parser for Node tests; production uses the browser DOMParser.
global.DOMParser = class {
  parseFromString(text) {
    const script = `import sys,json,xml.etree.ElementTree as E
def node(e):
 return {'tag':e.tag,'attrs':e.attrib,'text':''.join(e.itertext()),'children':[node(c) for c in e]}
try: print(json.dumps(node(E.fromstring(sys.stdin.read()))))
except Exception: print(json.dumps({'tag':'parsererror','attrs':{},'text':'invalid','children':[]}))`;
    const result = spawnSync('python3', ['-c', script], {input: text, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});
    if (result.status !== 0) throw Error(result.stderr);
    function wrap(n) {
      const children = n.children.map(wrap);
      return {tag: n.tag, textContent: n.text,
        getAttribute: key => n.attrs[key] ?? null,
        getAttributeNS: (ns, key) => n.attrs['{' + ns + '}' + key] ?? null,
        getElementsByTagNameNS: (_, name) => children.flatMap(c => [c, ...c.getElementsByTagNameNS('*', '*')]).filter(c => name === '*' || c.tag.split('}').pop() === name)};
    }
    return wrap({tag:'document',attrs:{},text:'',children:[JSON.parse(result.stdout)]});
  }
};
function zip(files) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = Buffer.from(name), raw = Buffer.from(text), body = zlib.deflateRawSync(raw);
    const l = Buffer.alloc(30); l.writeUInt32LE(0x04034b50); l.writeUInt16LE(8, 8);
    l.writeUInt32LE(body.length, 18); l.writeUInt32LE(raw.length, 22); l.writeUInt16LE(nameBytes.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50); c.writeUInt16LE(8, 10);
    c.writeUInt32LE(body.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nameBytes.length, 28); c.writeUInt32LE(offset, 42);
    locals.push(l, nameBytes, body); centrals.push(c, nameBytes); offset += l.length + nameBytes.length + body.length;
  }
  const central = Buffer.concat(centrals), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
  const b = Buffer.concat([...locals, central, end]); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
const files = {
  'xl/workbook.xml': '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="المواد" r:id="r1"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>',
  'xl/sharedStrings.xml': '<sst><si><t>الرقم المخزني</t></si><si><t>اسم المادة</t></si><si><t>اختبار &amp; مادة</t></si></sst>',
  'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>001-AA</t></is></c><c r="B2" t="s"><v>2</v></c></row><row r="3"><c r="A3"><v>3067</v></c><c r="B3" t="inlineStr"><is><t>مادة ثانية</t></is></c></row></sheetData></worksheet>'
};
(async () => {
  const input = api.records(await api.readXlsx(zip(files)));
  assert.deepEqual(input, [{code:'001-AA',name:'اختبار & مادة'}, {code:'3067',name:'مادة ثانية'}]);
  await assert.rejects(api.readXlsx(zip({...files, 'xl/worksheets/sheet1.xml': files['xl/worksheets/sheet1.xml'].replace('<v>3067</v>', '<f>1+1</f><v>2</v>')})), /معادلات/);
  await assert.rejects(api.readXlsx(new ArrayBuffer(5)), /xlsx/);
  assert.throws(() => api.records([['اسم المادة','الرقم المخزني'],['x','a']]), /عناوين/);
  assert.throws(() => api.records([['الرقم المخزني','اسم المادة'],['','a']]), /الصف 2/);
  assert.throws(() => api.plan([{code:'1',name:'أ'},{code:'1',name:'ب'}], []), /مختلفة/);
  const current = {items:[{id:'old',code:'3067',name:'الاسم القديم',quantity:50,packSize:24,prices:{retail:24000}}], invoices:[{id:'invoice'}]};
  const before = JSON.stringify(current);
  let id = 0;
  const next = api.apply(current, api.plan(input, current.items), () => 'new-' + ++id);
  assert.equal(next.items.length, 2); assert.equal(next.items[0].name, 'الاسم القديم');
  assert.equal(next.items[1].code, '001-AA'); assert.equal(next.items[1].needsSetup, true);
  assert.equal(next.items[1].reorderEnabled, false); assert.equal(next.items[1].prices.retail, null);
  assert.equal(JSON.stringify(current), before); assert.equal(next.invoices, current.invoices);
  assert.ok(api.plan(input, next.items).every(r => r.action === 'skip'));
  const renamed = api.apply(current, api.plan(input, current.items, true), () => 'rename-new');
  assert.equal(renamed.items[0].name, 'مادة ثانية'); assert.equal(renamed.items[0].quantity, 50);
  assert.equal(renamed.items[0].prices.retail, 24000);
  assert.equal(api.plan([...input, input[0]], [])[2].action, 'duplicate');
  if (process.argv[2]) {
    const b = fs.readFileSync(process.argv[2]);
    const actual = api.records(await api.readXlsx(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
    assert.equal(actual.length, 363); assert.equal(actual[0].code, '64353475'); assert.equal(actual.at(-1).code, '64332970');
    assert.equal(api.plan(actual, []).filter(r => r.action === 'add').length, 363);
    console.log('PASS: actual 363-row workbook, first/last codes and order');
  }
  console.log('PASS: compressed XLSX, shared/inline text, literal codes, formula/invalid rejection, duplicate handling, rename-only option, data preservation and repeat import');
})().catch(e => { console.error(e); process.exitCode = 1; });
