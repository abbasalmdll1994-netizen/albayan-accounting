(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
function money(n){return (Number(n)||0).toLocaleString('ar-IQ',{maximumFractionDigits:2})+' د.ع'}
function install(){
 if(typeof invoiceHTML!=='function'||window.__salesPrintFinal)return;
 window.__salesPrintFinal=true;
 const base=invoiceHTML;
 invoiceHTML=function(v){
  let html=base(v);
  const total=typeof invoiceTotal==='function'?invoiceTotal(v):0;
  const listTotal=(v.lines||[]).reduce((n,l)=>n+(typeof lineCents==='function'?lineCents(l):0),0)/100;
  const discount=Math.max(0,Number(v.discount)||0);
  const loading=Math.max(0,Number(v.loading)||0);
  const paid=Math.max(0,Number(v.paid)||0);
  const c=typeof cents==='function'?cents:n=>Math.round((Number(n)||0)*100);
  const remaining=Math.max(0,(c(total)-c(paid))/100);
  const rows=[
   '<p><span>مجموع القائمة</span><b>'+money(listTotal)+'</b></p>',
   '<p><span>أجور التحميل</span><b>'+money(loading)+'</b></p>'
  ];
  if(discount>0)rows.push('<p><span>الخصم</span><b>'+money(discount)+'</b></p>');
  rows.push('<p><span>المدفوع</span><b>'+money(paid)+'</b></p>');
  rows.push('<p><span>المتبقي</span><b>'+money(remaining)+'</b></p>');
  rows.push('<p class="grand"><span>المجموع الكلي</span><span>'+money(total)+'</span></p>');
  const replacement='<div class="invoice-totals">'+rows.join('')+'</div><p class="muted">';
  html=html.replace(/<div class="invoice-totals">[\s\S]*?<\/div><p class="muted">/,replacement);
  return html;
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();