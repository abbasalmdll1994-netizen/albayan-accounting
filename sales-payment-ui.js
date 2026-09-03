(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
function gross(){if(typeof draftLines==='undefined'||typeof lineCents!=='function'||typeof cents!=='function')return 0;return (draftLines.reduce((n,l)=>n+lineCents(l),0)+cents(Number(document.getElementById('saleLoading')?.value)||0))/100}
function net(){return Math.max(0,(cents(gross())-cents(Number(document.getElementById('saleDiscount')?.value)||0))/100)}
function install(){
 const form=document.getElementById('saleForm'),paid=document.getElementById('salePaid'),due=document.getElementById('saleDue');
 if(!form||!paid||document.getElementById('salePaymentMethod'))return;
 const label=document.createElement('label');
 label.innerHTML='طريقة الدفع<select id="salePaymentMethod"><option value="cash">نقدي</option><option value="credit">آجل</option><option value="partial">دفع جزئي</option></select>';
 paid.closest('.grid')?.insertBefore(label,paid.parentElement);
 const method=label.querySelector('select');
 function apply(){const total=net();if(method.value==='cash'){paid.value=String(total);if(due)due.value=''}else if(method.value==='credit')paid.value='0';paid.readOnly=method.value!=='partial';if(due){due.required=method.value!=='cash';due.disabled=method.value==='cash';due.closest('label')?.classList.toggle('payment-due-required',method.value!=='cash')}if(typeof updateSaleTotals==='function')updateSaleTotals()}
 method.addEventListener('change',apply);
 ['saleLoading','saleDiscount'].forEach(id=>document.getElementById(id)?.addEventListener('input',()=>{if(method.value==='cash')apply()}));
 document.getElementById('saleLines')?.addEventListener('change',()=>{setTimeout(()=>{if(method.value==='cash')apply()},0)});
 document.getElementById('saleLines')?.addEventListener('input',()=>{setTimeout(()=>{if(method.value==='cash')apply()},0)});
 form.addEventListener('submit',e=>{const total=net(),p=Number(paid.value)||0;if(method.value==='partial'&&(p<=0||cents(p)>=cents(total))){e.preventDefault();e.stopImmediatePropagation();if(typeof notify==='function')notify('بالدفع الجزئي أدخل مبلغاً أكبر من صفر وأقل من المجموع بعد الخصم.');paid.focus();return}if(method.value!=='cash'&&due&&!due.value){e.preventDefault();e.stopImmediatePropagation();if(typeof notify==='function')notify('حدد تاريخ استحقاق الدين قبل حفظ الفاتورة.');due.focus()}},true);
 document.addEventListener('click',e=>{const b=e.target.closest('[data-edit-sale]');if(!b)return;setTimeout(()=>{const v=typeof state!=='undefined'?state.invoices.find(x=>x.id===b.dataset.editSale):null;if(!v)return;const total=typeof invoiceTotal==='function'?invoiceTotal(v):0;const p=Number(v.paid)||0;method.value=p<=0?'credit':cents(p)>=cents(total)?'cash':'partial';paid.readOnly=method.value!=='partial';if(due){due.required=method.value!=='cash';due.disabled=method.value==='cash'}},0)});
 const reset=document.getElementById('resetSale');reset?.addEventListener('click',()=>setTimeout(()=>{method.value='cash';apply()},0));
 apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();