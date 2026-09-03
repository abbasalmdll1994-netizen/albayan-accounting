(function (root) {
  'use strict';
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const threshold = item => item.minStockCartons === undefined ? 2 : item.minStockCartons;
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const copy = data => JSON.parse(JSON.stringify(data));
  function validate(data) {
    for (const item of data.items) {
      if ((item.reorderEnabled !== undefined && typeof item.reorderEnabled !== 'boolean') || !integer(threshold(item)) || !Number.isSafeInteger((threshold(item) + 1) * item.packSize))
        throw Error('حد التنبيه للصنف يجب أن يكون عدداً صحيحاً بالكارتون.');
    }
    if (data.purchaseOrders === undefined) return data;
    if (!Array.isArray(data.purchaseOrders)) throw Error('قائمة طلبيات الشراء غير صالحة.');
    const ids = new Set(), numbers = new Set();
    for (const order of data.purchaseOrders) {
      if (!order || typeof order.id !== 'string' || !order.id || ids.has(order.id) ||
          !integer(order.number) || !order.number || numbers.has(order.number) ||
          typeof order.supplier !== 'string' || !order.supplier.trim() || order.supplier.length > 150 ||
          !validDate(order.date) || !['pending', 'received', 'cancelled'].includes(order.status) ||
          typeof order.note !== 'string' || !Array.isArray(order.lines) || !order.lines.length)
        throw Error('بيانات طلبية الشراء غير صالحة.');
      ids.add(order.id); numbers.add(order.number);
      const items = new Set();
      for (const line of order.lines) {
        if (!line || typeof line.itemId !== 'string' || !line.itemId || items.has(line.itemId) ||
            typeof line.name !== 'string' || !line.name.trim() || !integer(line.cartons) || !line.cartons ||
            !integer(line.packSize) || !line.packSize || !Number.isSafeInteger(line.cartons * line.packSize))
          throw Error('كميات طلبية الشراء غير صالحة.');
        if (order.status === 'pending' && !data.items.some(item => item.id === line.itemId))
          throw Error('الصنف مرتبط بطلبية شراء معلّقة؛ استلم الطلبية أو ألغها قبل حذف الصنف.');
        items.add(line.itemId);
      }
      if (order.status === 'received' && (!validDate(order.receivedDate) ||
          typeof order.receiptReference !== 'string' || !order.receiptReference.trim()))
        throw Error('بيانات استلام طلبية الشراء غير صالحة.');
    }
    return data;
  }
  function lowStock(data) {
    const incoming = new Map();
    for (const order of data.purchaseOrders || []) if (order.status === 'pending') {
      for (const line of order.lines) incoming.set(line.itemId,
        (incoming.get(line.itemId) || 0) + line.cartons * line.packSize);
    }
    return data.items.filter(item => item.reorderEnabled !== false && item.quantity <= threshold(item) * item.packSize).map(item => {
      const orderedPieces = incoming.get(item.id) || 0;
      return {item, minCartons: threshold(item), orderedPieces,
        suggestedCartons: Math.max(0, Math.ceil(((threshold(item) + 1) * item.packSize - item.quantity - orderedPieces) / item.packSize))};
    });
  }
  function create(data, draft, id) {
    validate(data);
    if (typeof draft.supplier !== 'string' || !draft.supplier.trim()) throw Error('اكتب اسم المورد.');
    if (!Array.isArray(draft.lines) || !draft.lines.length) throw Error('اختر صنفاً واحداً على الأقل للطلبية.');
    const available = lowStock(data), next = copy(data);
    const order = {id, number: Math.max(0, ...(data.purchaseOrders || []).map(o => o.number)) + 1,
      supplier: draft.supplier.trim(), date: draft.date, note: String(draft.note || '').trim(), status: 'pending',
      lines: draft.lines.map(line => {
        const row = available.find(row => row.item.id === line.itemId);
        if (!row || !row.suggestedCartons) throw Error('تغيّرت حاجة الصنف أو توجد طلبية تغطي نقصه. راجع قائمة الأصناف.');
        return {itemId: row.item.id, name: row.item.name, code: row.item.code, packSize: row.item.packSize, cartons: line.cartons};
      })};
    next.purchaseOrders = [...(next.purchaseOrders || []), order];
    return validate(next);
  }
  function receive(data, id, date, reference) {
    validate(data);
    const next = copy(data), order = (next.purchaseOrders || []).find(o => o.id === id);
    if (!order || order.status !== 'pending') throw Error('هذه الطلبية مستلمة أو ملغاة بالفعل.');
    if (!validDate(date) || date < order.date || typeof reference !== 'string' || !reference.trim())
      throw Error('أدخل رقم فاتورة المورد أو سند التجهيز وتاريخ استلام صحيحاً.');
    for (const line of order.lines) {
      const item = next.items.find(item => item.id === line.itemId);
      if (!item) throw Error('أحد أصناف الطلبية غير موجود بالمخزون.');
      const quantity = item.quantity + line.cartons * line.packSize;
      if (!integer(quantity)) throw Error('رصيد الصنف بعد الاستلام يتجاوز الحد المسموح.');
      item.quantity = quantity;
    }
    order.status = 'received'; order.receivedDate = date; order.receiptReference = reference.trim();
    return validate(next);
  }
  function cancel(data, id) {
    validate(data);
    const next = copy(data), order = (next.purchaseOrders || []).find(o => o.id === id);
    if (!order || order.status !== 'pending') throw Error('يمكن إلغاء الطلبيات المعلّقة فقط.');
    order.status = 'cancelled';
    return validate(next);
  }
  const api = {threshold, validate, lowStock, create, receive, cancel};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StockOrders = api;
})(typeof window !== 'undefined' ? window : globalThis);
