(()=>{'use strict';
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const VER='fix-20260906-1';
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
    const b=document.querySelector('[data-section="'+CSS.escape(section)+'"]');
    if(b){b.click();return;}
    if(++tries<30)setTimeout(open,100);
  };
  open();
}
if(page==='representative-dashboard.html')bindDashboard();
if(page==='representative.html')activateRepresentativeSection();
})();