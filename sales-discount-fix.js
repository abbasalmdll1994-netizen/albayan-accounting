(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
let submittedDiscount=0;
function install(){
  const form=document.getElementById('saleForm');
  if(!form||typeof saleTransaction!=='function'||window.__salesDiscountPrimaryFix)return;
  window.__salesDiscountPrimaryFix=true;
  const baseSaleTransaction=saleTransaction;
  form.addEventListener('submit',()=>{
    submittedDiscount=Math.max(0,Number(document.getElementById('saleDiscount')?.value)||0);
  },true);
  saleTransaction=function(s,v,edit){
    v.discount=submittedDiscount;
    return baseSaleTransaction(s,v,edit);
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();