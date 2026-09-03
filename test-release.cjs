const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const scripts = html => [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
for (const file of fs.readdirSync('.').filter(f => /\.(html|js)$/.test(f))) {
  const contents = fs.readFileSync(file, 'utf8');
  for (const script of file.endsWith('.html') ? scripts(contents) : [contents]) new vm.Script(script, {filename: file});
}
function harness() {
  const nodes = new Map(), data = new Map(), popup = {html: '', prints: 0};
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {id, value: '', textContent: '', innerHTML: '', hidden: false, dataset: {}, checked: false,
      style: {}, classList: {add() {}, remove() {}, toggle() {}}, addEventListener() {}, querySelectorAll: () => [],
      setAttribute() {}, removeAttribute() {}, reset() {}, focus() {}});
    return nodes.get(id);
  };
  const context = {console, Intl, Date, Number, Math, JSON, Map, Set, String, URLSearchParams, crypto: crypto.webcrypto,
    document: {getElementById: node, querySelectorAll: () => [], addEventListener() {}, body: {classList: {add() {}, remove() {}}}},
    localStorage: {getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v)},
    addEventListener() {}, scrollTo() {}, location: {hash: '', search: '?mode=rep'}, alert() {}, confirm: () => true,
    prompt: () => 'سبب تجريبي', open: () => {const w = {print: () => popup.prints++, document: {
      write: text => {popup.html = text;}, close: () => w.onload?.()}}; return w;}};
  context.window = context;
  return {ctx: vm.createContext(context), data, popup};
}
const sales = harness();
vm.runInContext(fs.readFileSync('stock-orders.js', 'utf8'), sales.ctx);
for (const script of scripts(fs.readFileSync('index.html', 'utf8'))) vm.runInContext(script, sales.ctx);
vm.runInContext(`
const fixture={version:3,accounts:[],customerTiers:[],invoices:[],items:[{id:'item-1',name:'صابون',code:'1',packSize:24,quantity:100,cartonPrice:24000,piecePrice:1000,prices:{bulk:24000,wholesale:24000,market:24000,retail:24000}}]};
const makeInvoice=(unit,quantity,tier='retail')=>({id:'sale-1',number:1,customer:'زبون',date:'2026-09-03',phone:'',address:'',due:'',note:'',loading:0,paid:0,cancelled:false,priceTier:tier,lines:[{itemId:'item-1',name:'صابون',unit,quantity,packSize:24,cartonPrice:24000,piecePrice:1000,dozenPrice:12000}]});
const cartonSale=saleTransaction(fixture,makeInvoice('carton',2));
if(cartonSale.items[0].quantity!==52||invoiceTotal(cartonSale.invoices[0])!==48000)throw Error('Carton sale mismatch');
const dozenSale=saleTransaction(fixture,makeInvoice('dozen',2,'wholesale'));
if(dozenSale.items[0].quantity!==76)throw Error('Dozen conversion mismatch');
const edited=saleTransaction(cartonSale,makeInvoice('piece',3),'sale-1');
if(edited.items[0].quantity!==97)throw Error('Invoice edit stock mismatch');
const cancelled=cancelTransaction(edited,'sale-1');
if(cancelled.items[0].quantity!==100)throw Error('Invoice cancellation stock mismatch');
let invalid=0;for(const [unit,qty,tier] of [['piece',1,'bulk'],['piece',1,'wholesale'],['carton',10,'retail'],['piece',-1,'retail']]){try{saleTransaction(fixture,makeInvoice(unit,qty,tier))}catch{invalid++}}
if(invalid!==4||fixture.items[0].quantity!==100)throw Error('Sale validation failed');
try{cancelTransaction(cancelled,'sale-1');throw Error('Double cancel accepted')}catch(e){if(e.message==='Double cancel accepted')throw e}
if(!commit(cartonSale))throw Error('Sale persistence failed');
`, sales.ctx);
assert.equal(JSON.parse(sales.data.get('albayanWorkspaceV1')).items[0].quantity, 52);
sales.ctx.MaterialImport = require('./material-import.js');
vm.runInContext(`
const imported=validate(MaterialImport.apply(fixture,MaterialImport.plan([{code:'TEST-NEW',name:'مادة اختبار'}],fixture.items),()=> 'import-test'));
const pending=imported.items.find(i=>i.id==='import-test');
if(!pending.needsSetup||pending.prices.retail!==null||pending.reorderEnabled!==false)throw Error('Imported setup state mismatch');
const pendingInvoice=makeInvoice('piece',1);pendingInvoice.lines[0].itemId=pending.id;
pending.quantity=10;pending.prices.retail=24000;
let rejected=false;try{saleTransaction(imported,pendingInvoice)}catch(e){rejected=e.message.includes('أكمل بيانات')}
if(!rejected)throw Error('Pending item allowed for sale');
`, sales.ctx);
sales.data.set('albayanWorkspaceV1', 'newer data');
assert.equal(vm.runInContext('commit({...state})', sales.ctx), false);
assert.equal(sales.data.get('albayanWorkspaceV1'), 'newer data');

const cash = harness();
for (const script of scripts(fs.readFileSync('cash-handover.html', 'utf8'))) vm.runInContext(script, cash.ctx);
const date = vm.runInContext('today()', cash.ctx);
cash.data.set('albayanWorkspaceV1', JSON.stringify({accounts: [{date, owedTo: 50000, repId: 'rep-1'}]}));
vm.runInContext('handover();handover()', cash.ctx);
let rows = JSON.parse(cash.data.get('albayanCashHandoversV1'));
assert.equal(rows.length, 1);
assert.equal(rows[0].amount, 50000);
cash.ctx.testReceiptId = rows[0].id;
vm.runInContext('receive(testReceiptId);receive(testReceiptId);printReceipt(testReceiptId)', cash.ctx);
rows = JSON.parse(cash.data.get('albayanCashHandoversV1'));
assert.equal(rows.length, 1);
assert.equal(rows[0].status, 'received');
assert(cash.popup.html.includes('سند تسليم نقدية'));
assert(!cash.popup.html.includes('<script'));
assert.equal(cash.popup.prints, 1);
console.log('Release checks passed: all page/script syntax, carton/dozen/piece sales, tier restrictions, invoice edits/cancellation, stock validation, save conflicts, cash handover/receipt and print output.');
