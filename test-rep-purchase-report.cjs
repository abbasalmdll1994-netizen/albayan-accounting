const assert = require('node:assert/strict');
const {catalog, purchaseRows} = require('./rep-purchase-report.js');
const customers = [{id: 1, name: 'أحمد'}, {id: '2', name: 'علي'}, {id: 3, name: 'حسن'}];
const line = {itemId: 'soap', name: 'صابون', quantity: 2};
const options = {from: '2026-09-01', to: '2026-09-03', product: 'id:soap'};
const sales = [
  {id: 'a', customerId: '1', customer: 'اسم سابق', date: options.from, lines: [line]},
  {id: 'b', customer: 'أحمد', date: options.to, lines: [line]},
  {id: 'c', customerId: 2, date: options.to, cancelled: true, lines: [line]},
  {id: 'd', customerId: 3, date: '2026-08-31', lines: [line]},
  {id: 'e', customerId: 3, date: options.to, lines: [{...line, itemId: 'shampoo', name: 'شامبو'}]}
];
const pending = [
  {invoice: {id: 'p', customer: 'علي', date: options.to, lines: [line]}},
  {invoice: {...sales[0], pendingApproval: true}},
  {status: 'rejected', invoice: {customerId: 3, date: options.to, lines: [line]}}
];
const rows = purchaseRows(customers, sales, pending, options);
assert.deepEqual(rows.map(r => r.status), ['bought', 'waiting', 'notBought']);
assert.equal(rows[0].count, 2);
assert.equal(rows[0].lastDate, options.to);
assert.equal(rows[0].waiting, 0);
assert.equal(rows[1].waiting, 1);
assert.equal(purchaseRows(customers, sales, [], {...options, product: ''})[2].status, 'bought');
const approved = {...sales[0], pendingApproval: true, approvedByAdmin: true};
assert.equal(purchaseRows(customers, [approved], [{invoice: approved}], options)[0].status, 'bought');
assert.equal(purchaseRows(customers, [approved], [{invoice: approved}], options)[0].waiting, 0);
assert.equal(purchaseRows(customers, [{...approved, approvedByAdmin: false}], [], options)[0].status, 'notBought');
assert.equal(purchaseRows(customers, [{...sales[0], lines: [{...line, quantity: 0}]}], [], options)[0].status, 'notBought');
const choices = catalog([{id: 'soap', name: 'صابون جديد'}], sales, pending);
assert.equal(choices.length, 2);
assert.equal(choices.find(c => c.key === 'id:soap').name, 'صابون جديد');
assert.equal(catalog([], [{lines: [{name: 'صنف قديم'}]}], [])[0].key, 'name:صنف قديم');
console.log('Purchase report tests passed.');
