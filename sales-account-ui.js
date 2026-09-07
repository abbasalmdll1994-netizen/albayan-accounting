(()=>{
'use strict';
function init(){
 if(!document.getElementById('sales')||typeof window.invoiceTotal!=='function')return;
 const style=document.createElement('style');style.textContent=`
#sales .panel{border-radius:14px}#sales #saleForm>.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}#sales #saleLines{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}#sales #saleLines:before{content:'قائمة المواد';display:block;background:var(--navy);color:#fff;font-weight:700;padding:10px 14px}.sale-line{display:grid!important;grid-template-columns:minmax(190px,2.4fr) minmax(90px,.8fr) minmax(80px,.7fr) minmax(110px,1fr) minmax(110px,1fr) auto!important;gap:8px!important;padding:9px 10px!important;align-items:end;border-bottom:1px solid var(--line)}.sale-line label{font-size:12px}.sale-line label:first-child{grid-column:auto!important}.sale-line label:has([data-field="packSize"]),.sale-line label:has([data-field="dozenPrice"]),.sale-line label:has([data-field="piecePrice"]){display:none}.sale-line .line-total{grid-column:1/-1!important;margin:0;padding:3px 0;color:var(--navy);font-weight:700}.sale-line button[data-remove-line]{min-height:42px;padding:6px 10px}.sale-total{background:#edf3f8;border-radius:10px;margin-top:12px;padding:12px 14px!important;font-weight:700;color:var(--navy)}
@media(max-width:750px){#sales #saleForm>.grid{grid-template-columns:1fr 1fr}.sale-line{grid-template-columns:minmax(145px,2fr) 75px 70px 95px auto!important;gap:5px!important;padding:7px 6px!important}.sale-line input,.sale-line select{min-height:40px;padding:6px;font-size:13px}.sale-line label{font-size:11px}.sale-line button[data-remove-line]{padding:4px 7px;font-size:12px}#sales .panel{padding:12px}}
@media(max-width:430px){#sales #saleForm>.grid{grid-template-columns:1fr 1fr}.sale-line{grid-template-columns:minmax(125px,2fr) 68px 62px 86px!important}.sale-line button[data-remove-line]{grid-column:1/-1}.sale-line .line-total{font-size:12px}}
`;document.head.appendChild(style);
 const loading=document.getElementById('saleLoading');if(loading){const label=loading.closest('label');if(label)label.childNodes[0].textContent='الخصم · د.ع';loading.setAttribute('aria-label','الخصم');}
 const oldInvoiceHTML=window.invoiceHTML;
 window.invoiceTotal=function(v){const gross=v.lines.reduce((n,l)=>n+lineCents(l),0)/100;return Math.max(0,(cents(gross)-cents(Number(v.loading)||0))/100)};
 window.updateSaleTotals=function(){let gross=0;draftLines.forEach((l,n)=>{const val=lineCents(l)/100;gross+=val;const target=document.getElementById('lineTotal'+n);if(target)target.textContent=`المبلغ الكلي: ${Number.isFinite(val)?money(val):'—'} د.ع`});const discount=Number(document.getElementById('saleLoading')?.value)||0;const total=Math.max(0,(cents(gross)-cents(discount))/100);if(!Number.isFinite(total)){document.getElementById('saleTotals').textContent='راجع سعر ووحدة وكمية كل صنف.';return NaN}const paid=Number(document.getElementById('salePaid')?.value)||0;document.getElementById('saleTotals').textContent=`مجموع القائمة: ${money(gross)} د.ع · الخصم: ${money(discount)} د.ع · المجموع الكلي: ${money(total)} د.ع · المتبقي: ${money((cents(total)-cents(paid))/100)} د.ع`;return total};
 if(typeof oldInvoiceHTML==='function')window.invoiceHTML=function(v){return oldInvoiceHTML(v).replace(/أجور تحميل/g,'الخصم')};
 loading?.addEventListener('input',()=>window.updateSaleTotals());
 window.updateSaleTotals();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();