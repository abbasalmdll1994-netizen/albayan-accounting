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
  const discount=Math.max(0,Number(v.discount)||0);
  const loading=Math.max(0,Number(v.loading)||0);
  const paid=Math.max(0,Number(v.paid)||0);
  const remaining=Math.max(0,((typeof cents==='function'?cents(total):Math.round(total*100))-(typeof cents==='function'?cents(paid):Math.round(paid*100)))/100);
  const rows=[];
  if(loading>0)rows.push('<p><span>أجور التحميل</span><b>'+money(loading)+'</b></p>');
  if(discount>0&&!html.includes('<span>الخصم</span>'))rows.push('<p><span>الخصم</span><b>'+money(discount)+'</b></p>');
  rows.push('<p><span>المدفوع</span><b>'+money(paid)+'</b></p>');
  rows.push('<p><span>المتبقي</span><b>'+money(remaining)+'</b></p>');
  const marker='<p class="grand"><span>المجموع الكلي</span>';
  if(html.includes(marker))html=html.replace(marker,rows.join('')+marker);
  return html;
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();