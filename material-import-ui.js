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

/* Sales list redesign — 2026-09-07 */
(() => {
  'use strict';
  const style=document.createElement('style');
  style.textContent=`
  #sales{--sale-blue:#0d4f86;--sale-mid:#1769aa;--sale-soft:#eef7ff;--sale-line:#cfe1f2}
  #sales>h2{color:#0d4f86;font-size:30px;margin-bottom:12px}
  #sales>.panel:first-of-type{border-color:#c9dff1;box-shadow:0 8px 26px rgba(18,59,99,.07);padding:18px}
  #sales #saleForm>.grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
  #sales #saleForm>.grid label{font-weight:700;color:#123b63}
  #sales #saleForm input,#sales #saleForm select{border-color:#bfd5e8;background:#fff}
  #sales #tierHint{padding:8px 12px;margin:10px 0;border-right-color:#1769aa;background:#f1f8ff}
  #saleLines{overflow-x:auto;border:1px solid var(--sale-line);border-radius:10px;background:white;margin-top:12px}
  #saleLines .sale-table{width:100%;min-width:850px;border-collapse:collapse;white-space:nowrap}
  #saleLines .sale-table th{background:#dceeff;color:#123b63;text-align:center;border:1px solid #c7ddef;padding:9px 7px}
  #saleLines .sale-table td{border:1px solid #d8e5ef;padding:5px;background:#fff}
  #saleLines .sale-table input,#saleLines .sale-table select{min-height:40px;border:1px solid #c9d9e7;border-radius:6px;padding:5px 7px}
  #saleLines .sale-table .amount-cell{font-weight:800;color:#123b63;text-align:center;min-width:110px}
  #saleLines .sale-table .remove-line{color:#c62828;background:#fff3f3;border-color:#ffcaca;min-height:38px;padding:4px 10px}
  #sales .sale-summary{display:grid;grid-template-columns:1fr minmax(280px,420px);gap:16px;margin-top:16px;align-items:stretch}
  #sales .sale-summary-box{border:1px solid #cfe1f2;border-radius:10px;overflow:hidden;background:white}
  #sales .sale-summary-row{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #dce8f2;font-size:16px}
  #sales .sale-summary-row.grand{background:#e7f2ff;color:#0756a0;font-size:20px;font-weight:800}
  #sales .sale-summary-row.paid{background:#e8f8ef;color:#087a3d;font-weight:800}
  #sales .sale-summary-row.remain{background:#fff0f1;color:#c5222c;font-weight:800}
  #sales .actions button.primary{background:linear-gradient(180deg,#1769aa,#0d4f86);border-color:#0d4f86}
  @media(max-width:850px){#sales #saleForm>.grid{grid-template-columns:1fr 1fr}#sales .sale-summary{grid-template-columns:1fr}#sales>h2{font-size:24px}}
  @media(max-width:480px){#sales #saleForm>.grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const loadingInput=$('saleLoading');
  if(loadingInput){const label=loadingInput.closest('label');if(label&&label.firstChild)label.firstChild.nodeValue='الخصم · د.ع';}

  const originalSaleTransaction=saleTransaction;
  saleTransaction=function(current,invoice,editId=null){
    const old=editId?current.invoices.find(v=>v.id===editId):null;
    const entered=Number(invoice.loading)||0;
    if(old&&Object.prototype.hasOwnProperty.call(old,'discount')) invoice.discount=entered;
    else if(!old) invoice.discount=entered;
    else invoice.discount=0;
    invoice.loading=old&&!Object.prototype.hasOwnProperty.call(old,'discount')?(Number(old.loading)||0):0;
    return originalSaleTransaction(current,invoice,editId);
  };

  invoiceTotal=function(v){
    const subtotal=v.lines.reduce((n,l)=>n+lineCents(l),0)/100;
    const loading=Number(v.loading)||0,discount=Number(v.discount)||0;
    return cents(subtotal+loading-discount)/100;
  };

  drawLines=function(){
    const tier=tierById(selectedTier);
    $('tierHint').textContent=tier.label+' — الوحدات المسموحة: '+tier.units.map(u=>UNIT_LABELS[u]).join('، ');
    if(!draftLines.length){$('saleLines').innerHTML='<p class="empty">أضف صنفًا لبدء الفاتورة.</p>';updateSaleTotals();return;}
    $('saleLines').innerHTML=`<table class="sale-table"><thead><tr><th>تسلسل</th><th>اسم الصنف</th><th>الكمية</th><th>الوحدة</th><th>السعر</th><th>المبلغ الكلي</th><th>إجراء</th></tr></thead><tbody>${draftLines.map((l,n)=>{
      const unitPrice=l.unit==='carton'?l.cartonPrice:l.unit==='dozen'?l.dozenPrice:l.piecePrice;
      const val=Number.isFinite(unitPrice)&&Number.isFinite(l.quantity)?unitPrice*l.quantity:NaN;
      return `<tr data-line="${n}"><td style="text-align:center">${n+1}</td><td><select data-field="itemId" required aria-label="الصنف ${n+1}"><option value="">اختر الصنف</option>${state.items.filter(i=>!i.needsSetup).map(i=>`<option value="${esc(i.id)}" ${i.id===l.itemId?'selected':''}>${esc(i.name)}${i.prices[selectedTier]===null?' · السعر غير محدد':''}</option>`).join('')}</select></td><td><input data-field="quantity" type="number" min="1" step="1" value="${esc(l.quantity)}" required></td><td><select data-field="unit" required><option value="">الوحدة</option>${tier.units.map(u=>`<option value="${u}" ${l.unit===u?'selected':''}>${UNIT_LABELS[u]}</option>`).join('')}</select></td><td><input data-field="cartonPrice" type="number" min="0" step="0.01" value="${Number.isFinite(l.cartonPrice)?esc(l.cartonPrice):''}" required aria-label="سعر الكارتون"><input data-field="packSize" type="hidden" value="${esc(l.packSize)}"><input data-field="piecePrice" type="hidden" value="${Number.isFinite(l.piecePrice)?esc(l.piecePrice):''}"><input data-field="dozenPrice" type="hidden" value="${Number.isFinite(l.dozenPrice)?esc(l.dozenPrice):''}"></td><td class="amount-cell" id="lineTotal${n}">${Number.isFinite(val)?money(val):'—'}</td><td style="text-align:center"><button type="button" class="remove-line" data-remove-line="${n}" aria-label="حذف السطر ${n+1}">حذف</button></td></tr>`}).join('')}</tbody></table>`;
    updateSaleTotals();
  };

  updateSaleTotals=function(){
    let subtotal=0;
    draftLines.forEach((l,n)=>{const val=lineCents(l)/100;subtotal+=val;const target=$('lineTotal'+n);if(target)target.textContent=Number.isFinite(val)?money(val):'—'});
    subtotal=cents(subtotal)/100;
    const discount=Number($('saleLoading').value)||0,paid=Number($('salePaid').value)||0,total=cents(subtotal-discount)/100;
    if(!Number.isFinite(total)||total<0){$('saleTotals').innerHTML='<span class="danger">الخصم لا يمكن أن يكون أكبر من مجموع المبيعات.</span>';return NaN;}
    $('saleTotals').innerHTML=`<div class="sale-summary-box"><div class="sale-summary-row"><span>مجموع المبيعات</span><b>${money(subtotal)}</b></div><div class="sale-summary-row"><span>الخصم</span><b>${money(discount)}</b></div><div class="sale-summary-row grand"><span>المجموع الكلي</span><b>${money(total)}</b></div><div class="sale-summary-row paid"><span>المبلغ المدفوع</span><b>${money(paid)}</b></div><div class="sale-summary-row remain"><span>المتبقي</span><b>${money((cents(total)-cents(paid))/100)}</b></div></div>`;
    return total;
  };

  const originalInvoiceHTML=invoiceHTML;
  invoiceHTML=function(v){
    let html=originalInvoiceHTML(v);
    if(Object.prototype.hasOwnProperty.call(v,'discount')){
      html=html.replace(/<p><span>أجور تحميل<\/span><b>[^<]*<\/b><\/p>/,`<p><span>الخصم</span><b>${money(v.discount||0)}</b></p>`);
    }
    return html;
  };

  document.addEventListener('click',e=>{
    const b=e.target.closest('button[data-edit-sale]');if(!b)return;
    setTimeout(()=>{const v=state.invoices.find(x=>x.id===b.dataset.editSale);if(v&&Object.prototype.hasOwnProperty.call(v,'discount')){$('saleLoading').value=v.discount||0;updateSaleTotals();}},0);
  });

  drawLines();
})();
