(() => {
  'use strict';
  const panel = document.createElement('div');
  panel.className = 'panel no-print';
  panel.innerHTML = `<h3>استيراد مواد من Excel</h3>
    <p>اختر ملف .xlsx بحقلين: الرقم المخزني واسم المادة. ستُضاف المواد بنفس ترتيب الملف، ثم تكمل التعبئة والرصيد والأسعار من «تعديل».</p>
    <label>ملف المواد<input id="materialFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label>
    <label class="po-toggle" style="margin-top:12px"><input id="renameMaterials" type="checkbox">تحديث أسماء المواد الموجودة بنفس الرقم المخزني</label>
    <p id="materialImportMessage" role="status"></p>
    <div id="materialPreview" class="scroll" style="max-height:360px"></div>
    <div class="actions"><button id="confirmMaterialImport" class="primary" disabled>إضافة المواد</button><button id="cancelMaterialImport" type="button">إلغاء المعاينة</button></div>`;
  $('inventory').insertBefore(panel, $('inventory').children[1]);
  let input = null, previewState = null, generation = 0;
  const message = text => { $('materialImportMessage').textContent = text; };
  const labels = {add: 'إضافة جديدة', rename: 'تحديث الاسم فقط', skip: 'موجودة — بدون تغيير', duplicate: 'مكررة بالملف — تُتجاوز'};
  function preview() {
    $('confirmMaterialImport').disabled = true;
    if (!input) return;
    const planned = MaterialImport.plan(input, state.items, $('renameMaterials').checked);
    previewState = state;
    const add = planned.filter(r => r.action === 'add').length, rename = planned.filter(r => r.action === 'rename').length;
    message(`${input.length} صف · ${add} مادة جديدة · ${rename} تحديث اسم · ${planned.length - add - rename} متجاوزة. راجع القائمة ثم أكّد.`);
    $('materialPreview').innerHTML = '<table><thead><tr><th>الرقم المخزني</th><th>اسم المادة</th><th>الإجراء</th></tr></thead><tbody>' +
      planned.map(r => `<tr><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${labels[r.action]}</td></tr>`).join('') + '</tbody></table>';
    $('confirmMaterialImport').disabled = !add && !rename;
  }
  $('materialFile').addEventListener('change', async e => {
    const attempt = ++generation;
    input = null; previewState = null;
    $('confirmMaterialImport').disabled = true; $('materialPreview').innerHTML = '';
    const file = e.target.files[0]; if (!file) { message(''); return; }
    message('جارٍ قراءة الملف على هذا الجهاز…');
    try {
      if (!/\.xlsx$/i.test(file.name)) throw Error('اختر ملف .xlsx.');
      if (file.size > 10 * 1024 * 1024) throw Error('الحد الأعلى 10 ميغابايت.');
      const rows = await MaterialImport.readXlsx(await file.arrayBuffer());
      if (attempt !== generation) return;
      input = MaterialImport.records(rows); preview();
    } catch (error) { if (attempt === generation) { input = null; message(error.message); } }
  });
  $('renameMaterials').addEventListener('change', () => { try { preview(); } catch (e) { message(e.message); } });
  $('cancelMaterialImport').onclick = () => {
    generation++; input = null; previewState = null; $('materialFile').value = '';
    $('materialPreview').innerHTML = ''; $('confirmMaterialImport').disabled = true; message('');
  };
  $('confirmMaterialImport').onclick = () => {
    if (!input) return;
    try {
      if (previewState !== state) { preview(); message('تغيّر المخزون أثناء المعاينة. راجع القائمة المحدّثة ثم أكّد مرة ثانية.'); return; }
      const planned = MaterialImport.plan(input, state.items, $('renameMaterials').checked);
      const changed = planned.filter(r => ['add', 'rename'].includes(r.action));
      if (!changed.length) return;
      if (!confirm(`اعتماد ${changed.length} مادة؟ ستبقى الفواتير والأرصدة والأسعار السابقة محفوظة.`)) return;
      if (blocked || localStorage.getItem(KEY) !== storedSnapshot) throw Error('تغيّرت البيانات أو الحفظ متوقف؛ حدّث الصفحة قبل الاستيراد.');
      const next = validate(MaterialImport.apply(state, planned, uid));
      localStorage.setItem(KEY + 'BeforeMaterialImport', JSON.stringify(state));
      if (commit(next)) {
        const count = planned.filter(r => r.action === 'add').length;
        $('cancelMaterialImport').click();
        message(`تمت إضافة ${count} مادة وتحديث ${changed.length - count} اسم. أكمل بيانات المواد الجديدة من زر تعديل.`);
        notify('تم حفظ المواد على هذا الجهاز.');
      } else message('تعذّر حفظ الاستيراد. راجع الرسالة أسفل الشاشة.');
    } catch (e) { message(e.message); }
  };
})();
