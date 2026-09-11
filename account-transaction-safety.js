(()=>{
'use strict';
if(!/\/index\.html$/.test(location.pathname)&&!location.pathname.endsWith('/albayan-accounting/'))return;
function systemRow(a){if(!a)return false;const s=String(a.source||'').toLowerCase();return !!(a.receiptId||a.invoiceId||a.sourceOrderId||a.documentId||a.allocations?.length||['payment','payment-cash','payment-reversal','payment-cash-reversal','sale','representative-delivery','balance-correction'].includes(s)||s.startsWith('payment-')||s.startsWith('sale-'))}
function reason(a){const s=String(a?.source||'').toLowerCase();if(a?.receiptId||s.includes('payment'))return 'هذه الحركة مرتبطة بسند قبض. عدّلها أو ألغها من شاشة سندات القبض حتى يبقى FIFO والصندوق صحيحين.';if(a?.invoiceId||a?.sourceOrderId||s.includes('sale')||s.includes('delivery'))return 'هذه الحركة مرتبطة بفاتورة مبيعات. استخدم شاشة الفواتير بدل تعديل حركة الحساب مباشرة.';if(s==='balance-correction')return 'هذه حركة تصحيح رصيد نظامية ومحميّة من الحذف أو التعديل المباشر.';return 'هذه حركة نظامية مرتبطة بمستند آخر ولا يمكن تعديلها أو حذفها مباشرة.'}
function rowById(id){try{return (window.state?.accounts||[]).find(a=>String(a.id)===String(id))||null}catch{return null}}
function guard(e){const b=e.target.closest('button[data-edit-account],button[data-delete-account]');if(!b)return;const id=b.dataset.editAccount||b.dataset.deleteAccount,a=rowById(id);if(!systemRow(a))return;e.preventDefault();e.stopImmediatePropagation();const msg=reason(a);if(typeof window.notify==='function')window.notify(msg);else alert(msg)}
document.addEventListener('click',guard,true);
})();