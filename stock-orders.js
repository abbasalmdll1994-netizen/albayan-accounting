(function (root) {
  'use strict';
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const threshold = item => item.minStockCartons === undefined ? 2 : item.minStockCartons;
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const copy = data => JSON.parse(JSON.stringify(data));
  function validate(data) {
    for (const item of data.items) {
      if ((item.reorderEnabled !== undefined && typeof item.reorderEnabled !== 'boolean') || !integer(threshold(item)) || !Number.isSafeInteger((threshold(item) + 1) * item.packSize)) throw Error('حد التنبيه للصنف يجب أن يكون عدداً صحيحاً بالكارتون.');
    }
    if (data.purchaseOrders === undefined) return data;
    if (!Array.isArray(data.purchaseOrders)) throw Error('قائمة طلبيات الشراء غير صالحة.');
    const ids = new Set(), numbers = new Set();
    for (const order of data.purchaseOrders) {
      if (!order || typeof order.id !== 'string' || !order.id || ids.has(order.id) || !integer(order.number) || !order.number || numbers.has(order.number) || typeof order.supplier !== 'string' || !order.supplier.trim() || order.supplier.length > 150 || !validDate(order.date) || !['pending', 'received', 'cancelled'].includes(order.status) || typeof order.note !== 'string' || !Array.isArray(order.lines) || !order.lines.length) throw Error('بيانات طلبية الشراء غير صالحة.');
      ids.add(order.id); numbers.add(order.number); const items = new Set();
      for (const line of order.lines) {
        if (!line || typeof line.itemId !== 'string' || !line.itemId || items.has(line.itemId) || typeof line.name !== 'string' || !line.name.trim() || !integer(line.cartons) || !line.cartons || !integer(line.packSize) || !line.packSize || !Number.isSafeInteger(line.cartons * line.packSize)) throw Error('كميات طلبية الشراء غير صالحة.');
        if (order.status === 'pending' && !data.items.some(item => item.id === line.itemId)) throw Error('الصنف مرتبط بطلبية شراء معلّقة؛ استلم الطلبية أو ألغها قبل حذف الصنف.');
        items.add(line.itemId);
      }
      if (order.status === 'received' && (!validDate(order.receivedDate) || typeof order.receiptReference !== 'string' || !order.receiptReference.trim())) throw Error('بيانات استلام طلبية الشراء غير صالحة.');
    }
    return data;
  }
  function lowStock(data) {
    const incoming = new Map();
    for (const order of data.purchaseOrders || []) if (order.status === 'pending') for (const line of order.lines) incoming.set(line.itemId,(incoming.get(line.itemId) || 0) + line.cartons * line.packSize);
    return data.items.filter(item => item.reorderEnabled !== false && item.quantity <= threshold(item) * item.packSize).map(item => {const orderedPieces = incoming.get(item.id) || 0;return {item, minCartons: threshold(item), orderedPieces,suggestedCartons: Math.max(0, Math.ceil(((threshold(item) + 1) * item.packSize - item.quantity - orderedPieces) / item.packSize))};});
  }
  function create(data, draft, id) {
    validate(data);
    if (typeof draft.supplier !== 'string' || !draft.supplier.trim()) throw Error('اكتب اسم المورد.');
    if (!Array.isArray(draft.lines) || !draft.lines.length) throw Error('اختر صنفاً واحداً على الأقل للطلبية.');
    const next = copy(data), seen = new Set();
    const order = {id, number: Math.max(0, ...(data.purchaseOrders || []).map(o => o.number)) + 1,supplier: draft.supplier.trim(), date: draft.date, note: String(draft.note || '').trim(), status: 'pending',lines: draft.lines.map(line => {
      const item=data.items.find(i=>i.id===line.itemId); if(!item) throw Error('أحد الأصناف غير موجود بالمخزون.');
      if(seen.has(item.id)) throw Error('الصنف مكرر في الطلبية.'); seen.add(item.id);
      const cartons=Number(line.cartons); if(!Number.isSafeInteger(cartons)||cartons<1) throw Error('كمية الشراء يجب أن تكون عدداً صحيحاً بالكارتون.');
      return {itemId:item.id,name:item.name,code:item.code,packSize:item.packSize,cartons};
    })};
    next.purchaseOrders = [...(next.purchaseOrders || []), order]; return validate(next);
  }
  function receive(data, id, date, reference) {
    validate(data); const next = copy(data), order = (next.purchaseOrders || []).find(o => o.id === id);
    if (!order || order.status !== 'pending') throw Error('هذه الطلبية مستلمة أو ملغاة بالفعل.');
    if (!validDate(date) || date < order.date || typeof reference !== 'string' || !reference.trim()) throw Error('أدخل رقم فاتورة المورد أو سند التجهيز وتاريخ استلام صحيحاً.');
    for (const line of order.lines) {const item = next.items.find(item => item.id === line.itemId);if (!item) throw Error('أحد أصناف الطلبية غير موجود بالمخزون.');const quantity = item.quantity + line.cartons * line.packSize;if (!integer(quantity)) throw Error('رصيد الصنف بعد الاستلام يتجاوز الحد المسموح.');item.quantity = quantity;}
    order.status = 'received'; order.receivedDate = date; order.receiptReference = reference.trim(); return validate(next);
  }
  function cancel(data, id) {validate(data);const next = copy(data), order = (next.purchaseOrders || []).find(o => o.id === id);if (!order || order.status !== 'pending') throw Error('يمكن إلغاء الطلبيات المعلّقة فقط.');order.status = 'cancelled';return validate(next);}
  const api = {threshold, validate, lowStock, create, receive, cancel}; if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StockOrders = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Approved purchase-order presentation, 2026-09-05 */
(function(){
 if(typeof document==='undefined') return;
 function install(){
  const section=document.getElementById('purchaseOrders'); if(!section)return;
  section.classList.add('po-approved');
  const h=section.querySelector(':scope>h2'); if(h) h.innerHTML='🛒 طلبية الشراء <small>الأصناف القليلة في المخزون</small>';
  const panel=section.querySelector('.panel');
  if(panel){
   const summary=document.getElementById('poSummary'); if(summary) summary.classList.add('po-alert');
   const ps=panel.querySelectorAll(':scope>p:not(#poSummary)'); ps.forEach(p=>p.classList.add('po-help'));
  }
  if(document.getElementById('poApprovedStyle'))return;
  const s=document.createElement('style');s.id='poApprovedStyle';s.textContent=`
  .po-approved{max-width:1180px;margin:auto}.po-approved>h2{font-size:30px;color:#123b63;margin:0 0 16px;display:flex;gap:12px;align-items:center}.po-approved>h2 small{display:block;font-size:18px;font-weight:400;color:#526579}.po-approved>.panel:first-of-type{border-radius:16px;padding:18px;box-shadow:0 2px 10px #123b6312}.po-approved .po-alert{display:inline-flex;min-width:210px;padding:14px 18px;background:#ffe4e4;color:#9f1515;border-radius:12px;font-weight:700;font-size:18px}.po-approved .po-help{display:none}.po-approved #poForm>.grid{grid-template-columns:1fr 1fr;margin:10px 0 16px}.po-approved #poSuggestions{display:block;margin:12px 0;border:1px solid #cddceb;border-radius:12px;overflow:hidden}.po-approved #poSuggestions .po-item{display:grid;grid-template-columns:minmax(220px,2fr) minmax(120px,1fr) minmax(130px,1fr) minmax(180px,1.2fr);align-items:center;gap:0;margin:0;padding:12px;border:0;border-bottom:1px solid #d9e3ed;border-radius:0}.po-approved #poSuggestions .po-item:last-child{border-bottom:0}.po-approved #poSuggestions .po-item strong{font-size:17px}.po-approved #poSuggestions input[type=number]{background:#f1f4f8;text-align:center;font-weight:700}.po-approved #poSuggestions button{min-height:44px;margin:3px}.po-approved #poSuggestions button:not(.danger){background:#079447;color:#fff;border-color:#079447}.po-approved #poSuggestions button.danger{background:#d92d2d;color:#fff;border-color:#d92d2d}.po-approved #savePurchaseOrder{width:50%;margin-right:50%;background:#079447;border-color:#079447;font-size:18px}.po-approved #poHistory{margin-top:12px}
  @media(max-width:750px){.po-approved>h2{font-size:25px;flex-wrap:wrap}.po-approved>h2 small{width:100%;font-size:16px}.po-approved #poForm>.grid{grid-template-columns:1fr 1fr}.po-approved #poSuggestions{overflow-x:auto}.po-approved #poSuggestions .po-item{min-width:690px;grid-template-columns:210px 120px 140px 200px}.po-approved #savePurchaseOrder{width:100%;margin:8px 0 0}.po-approved>.panel:first-of-type{padding:12px}.po-approved .po-alert{min-width:0;font-size:16px}}
  `;document.head.appendChild(s);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
