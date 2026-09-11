(()=>{
'use strict';
if(!/\/index\.html$/.test(location.pathname)&&!location.pathname.endsWith('/albayan-accounting/'))return;
function invoice(id){try{return typeof state!=='undefined'&&state&&Array.isArray(state.invoices)?state.invoices.find(v=>String(v.id)===String(id)):null}catch(_){return null}}
function paid(v){return Number(v&&v.paid||0)>0.0001}
function message(){const m='هذه الفاتورة عليها تسديد. اعكس سند القبض المرتبط أولاً، وبعد ما يرجع المدفوع صفر تقدر تعدل الزبون أو الأصناف أو الأسعار.';try{if(typeof notify==='function')notify(m);else alert(m)}catch(_){alert(m)}}
function guardEdit(e){const b=e.target.closest('[data-edit-sale]');if(!b)return;const v=invoice(b.dataset.editSale);if(!paid(v))return;e.preventDefault();e.stopImmediatePropagation();message()}
function guardSubmit(e){try{if(typeof saleEdit==='undefined'||!saleEdit)return;const v=invoice(saleEdit);if(!paid(v))return;e.preventDefault();e.stopImmediatePropagation();message()}catch(_){}}
document.addEventListener('click',guardEdit,true);
const install=()=>document.getElementById('saleForm')?.addEventListener('submit',guardSubmit,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install):install();
})();