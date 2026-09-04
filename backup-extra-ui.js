(() => {
'use strict';
const CASH_KEY='albayanCashMovements';
function install(){
 const downloadBtn=document.getElementById('downloadBackup'),restoreBtn=document.getElementById('restoreBackup'),file=document.getElementById('restoreFile');
 if(!downloadBtn||!restoreBtn||!file||downloadBtn.dataset.extraBackup)return;
 downloadBtn.dataset.extraBackup='1';
 downloadBtn.addEventListener('click',e=>{
  e.stopImmediatePropagation();
  try{
   const core=JSON.parse(localStorage.getItem(typeof KEY==='string'?KEY:'albayanData')||JSON.stringify(typeof state!=='undefined'?state:{}));
   let cash=[];try{const x=JSON.parse(localStorage.getItem(CASH_KEY)||'[]');cash=Array.isArray(x)?x:[]}catch(_){}
   const pack={...core,_albayanExtra:{version:1,cashMovements:cash}};
   if(typeof download==='function'&&typeof localDate==='function')download(JSON.stringify(pack,null,2),'albayan-backup-'+localDate()+'.json','application/json');
  }catch(err){if(typeof notify==='function')notify('تعذّر تجهيز النسخة الاحتياطية: '+err.message)}
 },true);
 restoreBtn.addEventListener('click',async e=>{
  const f=file.files?.[0];if(!f)return;
  try{
   const data=JSON.parse(await f.text()),extra=data?._albayanExtra;
   if(extra&&Array.isArray(extra.cashMovements)){
    localStorage.setItem(CASH_KEY,JSON.stringify(extra.cashMovements));
    delete data._albayanExtra;
    e.stopImmediatePropagation();
    if(typeof restore==='function')restore(data);
   }
  }catch(_){}
 },true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install):install();
})();