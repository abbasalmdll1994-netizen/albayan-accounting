(()=>{'use strict';
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const VER='fix-20260909-2';
function go(url){location.href=url+(url.includes('?')?'&':'?')+'v='+VER;}
function compactDashboard(){
 const summary=document.querySelector('.summary');
 if(!summary||document.getElementById('todayAchievements'))return;
 const wrap=document.createElement('section');wrap.id='todayAchievements';wrap.style.cssText='margin:10px;background:#fff;border:1px solid #d9e3ed;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px #123b6308';
 const head=document.createElement('button');head.type='button';head.style.cssText='width:100%;border:0;background:#fff;color:#123b63;padding:15px 16px;font:700 18px Tahoma,Arial;display:flex;align-items:center;justify-content:space-between;gap:12px';head.innerHTML='<span>📊 منجزات اليوم</span><span id="achArrow">⌄</span>';
 const details=document.createElement('div');details.id='achDetails';details.hidden=true;details.style.cssText='padding:0 8px 10px';
 summary.parentNode.insertBefore(wrap,summary);wrap.append(head,details);details.appendChild(summary);
 summary.style.cssText+=';border:0;padding:0;background:#fff;';
 head.onclick=()=>{details.hidden=!details.hidden;document.getElementById('achArrow').textContent=details.hidden?'⌄':'⌃';};
 const day=document.getElementById('dayStatus');if(day){day.style.margin='0 10px 10px';day.style.borderRadius='12px';}
 const sync=document.querySelector('.sync-info');if(sync)sync.style.display='none';
 const syncBtn=document.getElementById('fullSyncBtn');if(syncBtn)syncBtn.style.display='none';
 const tabs=document.querySelector('.tabs');if(tabs)tabs.style.display='none';
 const frame=document.querySelector('.frame.on');if(frame)frame.style.height='calc(100% - 310px)';
 const debtBtn=document.querySelector('[data-open-section="debts"]');if(debtBtn){debtBtn.innerHTML='💰 التسديد<small>سند قبض وحسابات الزبائن</small>';debtBtn.dataset.paymentFlow='1';}
}
function bindDashboard(){
 compactDashboard();
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-open-section],[data-open]');if(!b)return;
  if(b.dataset.paymentFlow==='1'){e.preventDefault();e.stopImmediatePropagation();go('representative.html?section=debts&payment=1');return;}
  if(b.dataset.openSection){e.preventDefault();e.stopImmediatePropagation();go('representative.html?section='+encodeURIComponent(b.dataset.openSection));return;}
  if(b.dataset.open==='closeFrame'){e.preventDefault();e.stopImmediatePropagation();go('rep-daily-close.html');return;}
  if(b.dataset.open==='cashFrame'){e.preventDefault();e.stopImmediatePropagation();go('cash-handover.html?mode=rep');}
 },true);
}
function activateRepresentativeSection(){const q=new URLSearchParams(location.search),section=q.get('section');if(!section)return;let tries=0;const open=()=>{const b=Array.from(document.querySelectorAll('[data-section]')).find(x=>x.dataset.section===section);if(b){b.click();return}if(++tries<40)setTimeout(open,100)};open();}
function hardenVisitSale(){let tries=0;const install=()=>{const btn=document.getElementById('visitSale');if(!btn){if(++tries<80)setTimeout(install,150);return}if(btn.dataset.mobileSaleFix==='1')return;btn.dataset.mobileSaleFix='1';btn.addEventListener('click',()=>{try{const name=String(document.getElementById('visitName')?.textContent||'').trim();if(name)sessionStorage.setItem('albayanRepSaleCustomer',name)}catch(_){}},true)};install();}
if(page==='representative-dashboard.html')bindDashboard();
if(page==='representative.html'){activateRepresentativeSection();hardenVisitSale();}
})();