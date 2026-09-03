(() => {
  'use strict';
  const api = window.StockOrders;
  let draft = new Map();
  const statuses = {pending: 'بانتظار الاستلام', received: 'مستلمة', cancelled: 'ملغاة'};
  const summary = item => `${money(Math.floor(item.quantity / item.packSize))} كارتون و${money(item.quantity % item.packSize)} قطعة`;
  function rememberDraft() {
    $('poSuggestions').querySelectorAll('[data-po-item]').forEach(row => {
      draft.set(row.dataset.poItem, {checked: row.querySelector('[data-po-check]').checked,
        quantity: row.querySelector('[data-po-quantity]').value});
    });
  }
  window.renderStockOrders = () => {
    rememberDraft();
    const low = api.lowStock(state), needing = low.filter(row => row.suggestedCartons > 0);
    $('stockAlert').hidden = low.length === 0;
    $('stockAlertText').textContent = `${low.length} صنف وصل حد التنبيه أو نفد — ${needing.length} يحتاج طلب شراء.`;
    $('poBadge').textContent = low.length ? ` (${low.length})` : '';
    $('poSummary').textContent = low.length ? `${low.length} صنف قليل؛ ${low.length - needing.length} تغطيه طلبيات معلّقة.` : 'المخزون أعلى من حدود التنبيه المحددة.';
    $('poSuggestions').innerHTML = low.map(({item, minCartons, orderedPieces, suggestedCartons}) => {
      const previous = draft.get(item.id), covered = suggestedCartons === 0;
      const checked = !covered && (previous ? previous.checked : false);
      const quantity = covered ? 0 : previous?.quantity ?? suggestedCartons;
      return `<div class="po-item" data-po-item="${esc(item.id)}"><strong>${esc(item.name)}</strong><input type="checkbox" data-po-check hidden ${checked ? 'checked' : ''}><div class="actions"><button type="button" data-accept-po aria-pressed="${checked}" class="${checked ? 'primary' : ''}" ${covered ? 'disabled' : ''}>${checked ? 'مقبول ✓' : 'قبول'}</button><button type="button" class="danger" data-reject-po="${esc(item.id)}">رفض</button></div>
        <p>المتوفر: ${summary(item)} · حد التنبيه: ${money(minCartons)} كارتون</p>
        ${orderedPieces ? `<p>بطلبية معلّقة: ${money(orderedPieces)} قطعة${covered ? ' — تغطي النقص' : ''}</p>` : ''}
        <label>الكمية المطلوبة · كارتون<input type="number" data-po-quantity min="1" step="1" value="${esc(quantity)}" ${covered || !checked ? 'disabled' : ''}></label>
        <p class="muted">${money(item.packSize)} قطعة بالكارتون · المقترح الآن: ${money(suggestedCartons)} كارتون</p></div>`;
    }).join('') || '<p class="empty">لا توجد أصناف قليلة حالياً. تستطيع تعديل حد التنبيه من الأصناف والمخزون.</p>';
    $('savePurchaseOrder').disabled = !needing.length || blocked;
    $('poHistory').innerHTML = [...(state.purchaseOrders || [])].reverse().map(order => `<details class="po-item"><summary><strong>طلبية ${order.number} · ${esc(order.supplier)}</strong> — ${statuses[order.status]}</summary>
      <p>${esc(order.date)}${order.note ? ' · ' + esc(order.note) : ''}</p>
      ${order.lines.map(line => `<p>${esc(line.name)}: ${money(line.cartons)} كارتون × ${money(line.packSize)} قطعة</p>`).join('')}
      ${order.status === 'received' ? `<p>استلام المخزون: ${esc(order.receivedDate)} · فاتورة / سند المورد: ${esc(order.receiptReference)}</p>` : ''}
      ${order.status === 'pending' ? `<div class="actions"><button type="button" class="primary" data-receive-po="${esc(order.id)}">تأكيد استلام كامل الطلبية</button><button type="button" class="danger" data-cancel-po="${esc(order.id)}">إلغاء الطلبية</button></div>` : ''}</details>`).join('') || '<p class="empty">لا توجد طلبيات شراء محفوظة بعد.</p>';
  };
  $('poSuggestions').addEventListener('input', rememberDraft);
  $('poSuggestions').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-accept-po')) {
      const row = button.closest('[data-po-item]'), check = row.querySelector('[data-po-check]');
      check.checked = !check.checked;
      button.textContent = check.checked ? 'مقبول ✓' : 'قبول';
      button.classList.toggle('primary', check.checked);
      button.setAttribute('aria-pressed', String(check.checked));
      row.querySelector('[data-po-quantity]').disabled = !check.checked;
      rememberDraft();
    }
    if (button.dataset.rejectPo) {
      const id = button.dataset.rejectPo;
      if (commit({...state, items: state.items.map(item => item.id === id ? {...item, reorderEnabled: false} : item)})) {
        draft.delete(id);
        notify('تم رفض الصنف وإيقاف اقتراحه. تستطيع إعادته من تعديل الصنف في المخزون.');
      }
    }
  });
  $('poForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      rememberDraft();
      const lines = [];
      $('poSuggestions').querySelectorAll('[data-po-item]').forEach(row => {
        if (row.querySelector('[data-po-check]').checked) lines.push({itemId: row.dataset.poItem,
          cartons: Number(row.querySelector('[data-po-quantity]').value)});
      });
      const next = api.create(state, {supplier: $('poSupplier').value, date: localDate(), note: $('poNote').value, lines}, uid());
      if (commit(next)) {
        $('poForm').reset(); draft.clear(); $('poSuggestions').innerHTML = ''; window.renderStockOrders();
        notify('تم حفظ طلبية الشراء بانتظار الاستلام.');
      }
    } catch (error) { notify(error.message); }
  });
  $('poHistory').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    try {
      if (button.dataset.cancelPo && confirm('إلغاء طلبية الشراء؟ ستظهر الأصناف الناقصة مجدداً للطلب.')) {
        if (commit(api.cancel(state, button.dataset.cancelPo))) {
          draft.clear(); $('poSuggestions').innerHTML = ''; window.renderStockOrders(); notify('تم إلغاء الطلبية.');
        }
      }
      if (button.dataset.receivePo) {
        const reference = prompt('رقم فاتورة المورد أو سند التجهيز:');
        if (reference === null) return;
        if (!reference.trim()) throw Error('اكتب رقم فاتورة المورد أو سند التجهيز.');
        if (!confirm('هل استلمت جميع الكميات بهذه الطلبية؟ التأكيد يضيفها إلى المخزون مرة واحدة.')) return;
        if (commit(api.receive(state, button.dataset.receivePo, localDate(), reference))) {
          draft.clear(); $('poSuggestions').innerHTML = ''; window.renderStockOrders(); notify('تم استلام الطلبية وإضافة الكميات للمخزون.');
        }
      }
    } catch (error) { notify(error.message); }
  });
  window.renderStockOrders();
  if (location.hash === '#purchaseOrders') go('purchaseOrders');
})();
