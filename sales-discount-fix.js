(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
let submittedDiscount=0;
function install(){
  const form=document.getElementById('saleForm');
  if(!form||typeof saleTransaction!=='function'||window.__salesDiscountPrimaryFix)return;
  if(document.getElementById('saleDiscount')){window.__salesDiscountPrimaryFix=true;return;}
  window.__salesDiscountPrimaryFix=true;
  const baseSaleTransaction=saleTransaction;
  form.addEventListener('submit',()=>{
    const raw=Number(document.getElementById('saleDiscount')?.value)||0;
    submittedDiscount=Math.max(0,raw);
  },true);
  saleTransaction=function(s,v,edit){
    const discount=submittedDiscount;
    const gross=(v.lines.reduce((n,l)=>n+lineCents(l),0)+cents(v.loading))/100;
    if(discount>gross) throw Error('الخصم لا يمكن أن يكون أكبر من مبلغ الفاتورة.');
    const afterDiscount=(cents(gross)-cents(discount))/100;
    if(cents(v.paid)>cents(afterDiscount)) throw Error('المبلغ المدفوع لا يمكن أن يكون أكبر من المجموع بعد الخصم.');
    v.discount=discount;
    return baseSaleTransaction(s,v,edit);
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();