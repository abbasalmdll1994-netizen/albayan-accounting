(() => {
'use strict';
const CASH_KEY='albayanCashMovements';
function validCash(rows){return Array.isArray(rows)&&rows.every(r=>r&&typeof r==='object'&&!Array.isArray(r));}
function install(){
 const downloadBtn=document.getElementById('downloadBackup'),restoreBtn=document.getElementById('restoreBackup'),file=document.getElementById('restoreFile');
 if(!downloadBtn||!restoreBtn||!file||downloadBtn.dataset.extraBackup)return;
 downloadBtn.dataset.extraBackup='1';
 downloadBtn.addEventListener('click',e=>{
  e.stopImmediatePropagation();
  try{
   const core=JSON.parse(localStorage.getItem(typeof KEY==='string'?KEY:'albayanData')||JSON.stringify(typeof state!=='undefined'?state:{}));
   let cash=[];try{const x=JSON.parse(localStorage.getItem(CASH_KEY)||'[]');cash=validCash(x)?x:[]}catch(_){}
   const pack={...core,_albayanExtra:{version:2,cashMovements:cash}};
   if(typeof download==='function'&&typeof localDate==='function')download(JSON.stringify(pack,null,2),'albayan-backup-'+localDate()+'.json','application/json');
  }catch(err){if(typeof notify==='function')notify('تعذّر تجهيز النسخة الاحتياطية: '+err.message)}
 },true);
 restoreBtn.addEventListener('click',async e=>{
  const f=file.files?.[0];if(!f)return;
  try{
   const data=JSON.parse(await f.text()),extra=data?._albayanExtra;
   if(!extra)return;
   if(!validCash(extra.cashMovements))throw Error('بيانات الصندوق في النسخة غير صالحة.');
   e.stopImmediatePropagation();
   const core={...data};delete core._albayanExtra;
   const oldCash=localStorage.getItem(CASH_KEY);
   const beforeCore=localStorage.getItem(typeof KEY==='string'?KEY:'albayanData');
   if(typeof restore!=='function')throw Error('تعذّر تشغيل الاسترجاع الأساسي.');
   restore(core);
   const afterCore=localStorage.getItem(typeof KEY==='string'?KEY:'albayanData');
   if(afterCore!==beforeCore){
    localStorage.setItem(CASH_KEY,JSON.stringify(extra.cashMovements));
    if(typeof window.renderCash==='function')window.renderCash();
    if(typeof notify==='function')notify('تم استرجاع النسخة كاملة مع حركات الصندوق.');
   }else if(oldCash!==null){localStorage.setItem(CASH_KEY,oldCash)}
  }catch(err){e.stopImmediatePropagation();if(typeof notify==='function')notify('تعذّر استرجاع النسخة الكاملة: '+err.message)}
 },true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install):install();
})();