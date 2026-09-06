(()=>{'use strict';
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const VER='fix-20260906-2';
function go(url){location.href=url+(url.includes('?')?'&':'?')+'v='+VER;}
function bindDashboard(){
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-open-section],[data-open]');
    if(!b)return;
    if(b.dataset.openSection){
      e.preventDefault();e.stopImmediatePropagation();
      go('representative.html?section='+encodeURIComponent(b.dataset.openSection));
      return;
    }
    if(b.dataset.open==='closeFrame'){
      e.preventDefault();e.stopImmediatePropagation();go('rep-daily-close.html');return;
    }
    if(b.dataset.open==='cashFrame'){
      e.preventDefault();e.stopImmediatePropagation();go('cash-handover.html?mode=rep');
    }
  },true);
}
function activateRepresentativeSection(){
  const section=new URLSearchParams(location.search).get('section');
  if(!section)return;
  let tries=0;
  const open=()=>{
    const b=Array.from(document.querySelectorAll('[data-section]')).find(x=>x.dataset.section===section);
    if(b){b.click();return;}
    if(++tries<40)setTimeout(open,100);
  };
  open();
}
function hardenVisitSale(){
  let tries=0;
  const install=()=>{
    const btn=document.getElementById('visitSale');
    if(!btn){if(++tries<80)setTimeout(install,150);return;}
    if(btn.dataset.mobileSaleFix==='1')return;
    btn.dataset.mobileSaleFix='1';
    btn.addEventListener('click',()=>{
      try{
        const name=String(document.getElementById('visitName')?.textContent||'').trim();
        if(name)sessionStorage.setItem('albayanRepSaleCustomer',name);
      }catch(_){ }
    },true);
  };
  install();
}
if(page==='representative-dashboard.html')bindDashboard();
if(page==='representative.html'){activateRepresentativeSection();hardenVisitSale();}
})();