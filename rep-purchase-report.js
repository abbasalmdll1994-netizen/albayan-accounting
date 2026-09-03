(function () {
  'use strict';
  const hasId = value => value !== undefined && value !== null && value !== '';
  const itemKey = item => hasId(item.itemId ?? item.id)
    ? 'id:' + String(item.itemId ?? item.id) : 'name:' + String(item.name || '');

  function catalog(items, invoices, pending) {
    const entries = new Map();
    for (const item of items || []) if (item.name) entries.set(itemKey(item), {key: itemKey(item), name: item.name});
    for (const invoice of [...(invoices || []), ...(pending || []).map(p => p.invoice || {})]) {
      for (const line of invoice.lines || []) {
        if (line.name && !entries.has(itemKey(line))) entries.set(itemKey(line), {key: itemKey(line), name: line.name});
      }
    }
    return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }

  function purchaseRows(customers, invoices, pending, options) {
    const {from, to, product = ''} = options;
    const matches = invoice => !invoice.cancelled && !invoice.rejectedAt &&
      invoice.date >= from && invoice.date <= to &&
      (invoice.lines || []).some(line => Number(line.quantity) > 0 && (!product || itemKey(line) === product));
    const posted = (invoices || []).filter(v => (!v.pendingApproval || v.approvedByAdmin) && matches(v));
    const postedIds = new Set(posted.filter(v => hasId(v.id)).map(v => String(v.id)));
    const waiting = (pending || []).filter(p => !p.rejectedAt && p.status !== 'rejected' && p.status !== 'cancelled')
      .map(p => ({...p.invoice, customerId: p.invoice?.customerId ?? p.customerId, customer: p.invoice?.customer || p.customerName}))
      .filter(v => matches(v) && (!hasId(v.id) || !postedIds.has(String(v.id))));
    const belongs = (invoice, customer) => hasId(invoice.customerId)
      ? String(invoice.customerId) === String(customer.id) : invoice.customer === customer.name;
    return customers.map(customer => {
      const sales = posted.filter(v => belongs(v, customer));
      const queued = waiting.filter(v => belongs(v, customer));
      return {customer, status: sales.length ? 'bought' : queued.length ? 'waiting' : 'notBought',
        count: sales.length, waiting: queued.length,
        lastDate: sales.reduce((date, v) => v.date > date ? v.date : date, '')};
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {catalog, purchaseRows};
    return;
  }

  const labels = {notBought: 'لم يشترِ', bought: 'اشترى', waiting: 'بانتظار الموافقة'};
  const fromInput = $('purchaseFrom'), toInput = $('purchaseTo');
  fromInput.value = today().slice(0, 7) + '-01';
  toInput.value = today();
  window.renderPurchaseReport = function () {
    const w = workspace(), pending = pendingInvoices(), product = $('purchaseProduct');
    const previous = product.value;
    const options = catalog(w.items, w.invoices, pending);
    product.innerHTML = '<option value="">أي صنف</option>' + options.map(item =>
      `<option value="${esc(item.key)}">${esc(item.name)}</option>`).join('');
    product.value = options.some(item => item.key === previous) ? previous : '';
    const from = fromInput.value, to = toInput.value;
    if (!from || !to || from > to) {
      $('purchaseSummary').textContent = 'حدد فترة صحيحة: تاريخ البداية قبل النهاية أو بنفس اليوم.';
      $('purchaseRows').innerHTML = '';
      return;
    }
    const profile = loadJSON(REPPROFILE, {});
    const base = $('purchaseScope').value === 'daily' ? dailyCustomers() : customers;
    const assigned = base.filter(c => !c.repId || String(c.repId) === String(profile.id || 'rep-1'));
    const rows = purchaseRows(assigned, w.invoices, pending, {from, to, product: product.value});
    const counts = {bought: 0, notBought: 0, waiting: 0};
    rows.forEach(row => counts[row.status]++);
    $('purchaseSummary').textContent = `اشترى: ${counts.bought} · لم يشترِ: ${counts.notBought} · بانتظار الموافقة: ${counts.waiting}`;
    const status = $('purchaseStatus').value;
    const shown = rows.filter(row => status === 'all' || row.status === status)
      .sort((a, b) => a.customer.name.localeCompare(b.customer.name, 'ar'));
    $('purchaseRows').innerHTML = shown.map(row => `<button type="button" class="customer purchase-customer" data-purchase-id="${esc(row.customer.id)}">
      <span class="badge ${row.status === 'bought' ? 'done' : row.status === 'waiting' ? 'cancelled' : 'pending'}">${labels[row.status]}</span>
      <h3>${esc(row.customer.name)}</h3><div>${esc(row.customer.area || '')}</div>
      ${row.lastDate ? `<div>آخر شراء ضمن الفترة: ${esc(row.lastDate)} · ${row.count} فاتورة</div>` : ''}
      ${row.waiting ? `<div>طلبات بانتظار الموافقة: ${row.waiting}</div>` : ''}
      <div class="muted">فتح الزبون للمتابعة</div></button>`).join('') ||
      '<div class="empty">' + (assigned.length ? 'لا يوجد زبائن بهذه الحالة ضمن الفترة المحددة.' : 'لا يوجد زبائن ضمن الجولة المختارة.') + '</div>';
    $('purchaseRows').querySelectorAll('[data-purchase-id]').forEach(button => {
      button.onclick = () => selectCustomer(button.dataset.purchaseId, 'reports');
    });
  };
  ['purchaseProduct', 'purchaseFrom', 'purchaseTo', 'purchaseScope', 'purchaseStatus'].forEach(id => {
    $(id).onchange = window.renderPurchaseReport;
  });
  window.renderPurchaseReport();
})();
