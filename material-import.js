/* Two-column XLSX import. No network dependencies; file bytes stay in the browser. */
(() => {
  'use strict';
  const fail = message => { throw Error(message); };
  const MAX = 16 * 1024 * 1024;
  async function archive(buffer) {
    const bytes = new Uint8Array(buffer), view = new DataView(buffer), entries = new Map();
    if (bytes.length > 10 * 1024 * 1024) fail('الملف أكبر من 10 ميغابايت.');
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
    }
    if (end < 0) fail('اختر ملف Excel بصيغة .xlsx غير محمي بكلمة مرور.');
    const count = view.getUint16(end + 10, true);
    let pos = view.getUint32(end + 16, true), total = 0;
    if (count > 2000 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) fail('صيغة الملف غير مدعومة.');
    for (let i = 0; i < count; i++) {
      if (pos + 46 > end || view.getUint32(pos, true) !== 0x02014b50) fail('ملف Excel تالف.');
      const flags = view.getUint16(pos + 8, true), method = view.getUint16(pos + 10, true);
      const size = view.getUint32(pos + 20, true), expanded = view.getUint32(pos + 24, true);
      const n = view.getUint16(pos + 28, true), extra = view.getUint16(pos + 30, true), comment = view.getUint16(pos + 32, true);
      const offset = view.getUint32(pos + 42, true);
      if (pos + 46 + n + extra + comment > end || (flags & 1) || ![0, 8].includes(method)) fail('ملف مضغوط أو محمي بصيغة غير مدعومة.');
      const name = new TextDecoder().decode(bytes.slice(pos + 46, pos + 46 + n));
      total += expanded;
      if (expanded > MAX || total > MAX * 4 || entries.has(name)) fail('حجم محتويات الملف أو بنيته غير مناسب.');
      entries.set(name, {size, expanded, offset, method});
      pos += 46 + n + extra + comment;
    }
    return async name => {
      const e = entries.get(name);
      if (!e) return null;
      if (e.offset + 30 > bytes.length || view.getUint32(e.offset, true) !== 0x04034b50) fail('جزء من الملف تالف.');
      const start = e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true);
      if (start + e.size > bytes.length) fail('ملف Excel غير مكتمل.');
      let data = bytes.slice(start, start + e.size);
      if (e.method === 8) {
        let unzip;
        try { unzip = new DecompressionStream('deflate-raw'); }
        catch (_) { fail('حدّث متصفح سامسونج أو Chrome لقراءة Excel على هذا الجهاز.'); }
        const reader = new Blob([data]).stream().pipeThrough(unzip).getReader();
        const chunks = []; let length = 0;
        try {
          for (;;) {
            const {done, value} = await reader.read(); if (done) break;
            length += value.length;
            if (length > e.expanded || length > MAX) { await reader.cancel(); fail('حجم الملف بعد فك الضغط غير صالح.'); }
            chunks.push(value);
          }
        } finally { reader.releaseLock(); }
        data = new Uint8Array(length); let at = 0;
        for (const chunk of chunks) { data.set(chunk, at); at += chunk.length; }
      }
      if (data.length !== e.expanded) fail('بيانات Excel غير مكتملة.');
      return new TextDecoder('utf-8', {fatal: true}).decode(data);
    };
  }
  const tags = (node, name) => [...node.getElementsByTagNameNS('*', name)];
  function xml(text) {
    if (!text || /<!DOCTYPE|<!ENTITY/i.test(text)) fail('محتوى Excel غير صالح.');
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (tags(doc, 'parsererror').length) fail('تعذّر قراءة محتوى Excel.');
    return doc;
  }
  async function readXlsx(buffer) {
    const get = await archive(buffer);
    const book = xml(await get('xl/workbook.xml'));
    const sheets = tags(book, 'sheet');
    if (sheets.length !== 1) fail('اختر ملفًا يحتوي ورقة واحدة فقط للمواد.');
    const id = sheets[0].getAttribute('r:id') || sheets[0].getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rels = tags(xml(await get('xl/_rels/workbook.xml.rels')), 'Relationship');
    const rel = rels.find(r => r.getAttribute('Id') === id);
    if (!rel || rel.getAttribute('TargetMode') === 'External') fail('ورقة المواد غير موجودة.');
    function path(target) {
      const u = new URL(target, 'https://xlsx.invalid/xl/');
      if (u.origin !== 'https://xlsx.invalid' || !u.pathname.startsWith('/xl/')) fail('مسار غير صالح داخل Excel.');
      return u.pathname.slice(1);
    }
    const sharedRel = rels.find(r => /\/sharedStrings$/.test(r.getAttribute('Type') || ''));
    const sharedText = await get(sharedRel ? path(sharedRel.getAttribute('Target')) : 'xl/sharedStrings.xml');
    const strings = sharedText ? tags(xml(sharedText), 'si').map(si => tags(si, 't').map(t => t.textContent).join('')) : [];
    const doc = xml(await get(path(rel.getAttribute('Target'))));
    const sourceRows = tags(doc, 'row');
    if (sourceRows.length > 5001) fail('الحد الأعلى 5000 مادة في الملف.');
    const rows = [];
    for (const row of sourceRows) {
      const values = [], columns = new Set();
      for (const cell of tags(row, 'c')) {
        const address = cell.getAttribute('r') || '';
        const match = /^([A-Z]+)[1-9][0-9]*$/.exec(address);
        if (!match) fail('عنوان خلية غير صالح.');
        let col = 0; for (const letter of match[1]) col = col * 26 + letter.charCodeAt(0) - 64;
        if (columns.has(col)) fail('خلية مكررة داخل Excel.'); columns.add(col);
        if (tags(cell, 'f').length) fail('الملف يجب أن يحتوي أسماء وأرقامًا ثابتة، بدون معادلات.');
        const type = cell.getAttribute('t'), raw = tags(cell, 'v')[0]?.textContent ?? '';
        let value = raw;
        if (type === 's') {
          if (!/^\d+$/.test(raw) || strings[Number(raw)] === undefined) fail('نص غير صالح داخل Excel.');
          value = strings[Number(raw)];
        } else if (type === 'inlineStr') value = tags(cell, 't').map(t => t.textContent).join('');
        else if (type && !['n', 'str'].includes(type) && raw) fail('نوع خلية غير مناسب للأسماء والأرقام.');
        if (col > 2 && value.trim()) fail('الملف يجب أن يحتوي حقلين فقط: الرقم المخزني واسم المادة.');
        if (col <= 2) values[col - 1] = value;
      }
      if (values.some(v => String(v).trim())) rows.push([values[0] || '', values[1] || '']);
    }
    return rows;
  }
  function records(rows) {
    if (!rows.length || rows[0][0].trim() !== 'الرقم المخزني' || rows[0][1].trim() !== 'اسم المادة')
      fail('عناوين أول صف يجب أن تكون: الرقم المخزني، اسم المادة.');
    if (rows.length < 2 || rows.length > 5001) fail('الملف فارغ أو يتجاوز 5000 مادة.');
    return rows.slice(1).map(([a, b], index) => {
      const code = String(a).trim(), name = String(b).trim();
      if (!code || code.length > 80 || !/^[\p{L}\p{N}_-]+$/u.test(code) || !name || name.length > 150)
        fail('راجع الرقم المخزني واسم المادة في الصف ' + (index + 2) + '.');
      return {code, name};
    });
  }
  function plan(input, existing, updateNames = false) {
    const seen = new Map(), byCode = new Map();
    for (const item of existing) {
      if (!item.code) continue;
      if (byCode.has(item.code)) fail('الرقم المخزني ' + item.code + ' مكرر بالمخزون؛ عالجه قبل الاستيراد.');
      byCode.set(item.code, item);
    }
    return input.map(row => {
      if (seen.has(row.code)) {
        if (seen.get(row.code) !== row.name) fail('الرقم ' + row.code + ' مكرر بأسماء مختلفة في الملف.');
        return {...row, action: 'duplicate'};
      }
      seen.set(row.code, row.name);
      const old = byCode.get(row.code);
      return {...row, action: !old ? 'add' : updateNames && row.name !== old.name ? 'rename' : 'skip', id: old?.id};
    });
  }
  function apply(current, planned, makeId) {
    const rename = new Map(planned.filter(r => r.action === 'rename').map(r => [r.id, r.name]));
    const items = current.items.map(item => rename.has(item.id) ? {...item, name: rename.get(item.id)} : item);
    for (const row of planned.filter(r => r.action === 'add')) items.push({
      id: makeId(), code: row.code, name: row.name, needsSetup: true,
      packSize: 1, quantity: 0, cartonPrice: 0, piecePrice: 0,
      prices: {bulk: null, wholesale: null, market: null, retail: null},
      minStockCartons: 2, reorderEnabled: false
    });
    return {...current, items};
  }
  const api = {archive, readXlsx, records, plan, apply};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.MaterialImport = api;
})();
