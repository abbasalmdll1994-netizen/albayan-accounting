(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
const css=`
@media(max-width:750px){
 body{padding-bottom:72px;background:#f4f7fb}
 header{padding:10px 14px;min-height:54px} header h1{font-size:19px} header p{font-size:11px}
 .system-links{display:none!important}
 nav{position:sticky;top:0;padding:7px 8px;gap:5px}nav button{min-height:38px;padding:6px 10px;font-size:12px}
 main{padding:10px 8px 78px}h2{font-size:19px;margin-bottom:10px}.panel{padding:10px;border-radius:11px;margin-bottom:10px}
 #sales>.panel:first-of-type{padding:9px}#sales #saleTitle{font-size:17px;margin:0 0 8px;color:#123b63}
 #saleForm>.grid:first-of-type{grid-template-columns:1fr 1fr;gap:6px}
 #saleForm>.grid:first-of-type label{font-size:11px;gap:2px}
 #saleForm>.grid:first-of-type input,#saleForm>.grid:first-of-type select{min-height:36px;padding:5px 7px;font-size:13px;border-radius:6px}
 #saleForm>.muted,#saleForm>.remember-tier,#tierHint{font-size:11px;margin:6px 0;padding:6px}
 .sale-line{grid-template-columns:1.55fr .75fr!important;gap:5px;padding:8px 0}.sale-line label:first-child{grid-column:1/-1!important}.sale-line label{font-size:11px;gap:2px}.sale-line input,.sale-line select{min-height:34px;padding:4px 6px;font-size:12px}.sale-line button{min-height:34px;padding:4px 9px}.sale-line .line-total{font-size:11px;margin:2px 0}
 #sales .actions{gap:6px;margin-top:8px}#sales .actions button{min-height:38px;padding:6px 10px;font-size:12px}
 #saleForm>.grid[style]{grid-template-columns:1fr 1fr!important;gap:6px!important;margin-top:9px!important}#saleForm>.grid[style] input{min-height:36px}
 .sale-total{padding:8px 4px;font-size:15px;font-weight:bold;gap:8px}
 #sales>.panel:last-child .toolbar{margin-bottom:7px}#sales>.panel:last-child .toolbar h3{font-size:15px;margin:0}#saleSearch{min-height:36px}
 #sales table{font-size:11px}#sales th,#sales td{padding:7px 5px}
 .cards{gap:7px;margin-bottom:10px}.card{padding:10px}.card strong{font-size:18px;margin-top:4px}.card span{font-size:11px}
 #home .panel{margin-bottom:9px}#home .actions{gap:5px;margin-top:8px}#home .actions button{min-height:38px;padding:6px 9px;font-size:12px}
 .mobile-bottom{position:fixed;bottom:0;right:0;left:0;height:62px;background:#123b63;display:grid;grid-template-columns:repeat(5,1fr);z-index:20;box-shadow:0 -3px 12px #0002;padding-bottom:env(safe-area-inset-bottom)}
 .mobile-bottom button{border:0;border-radius:0;background:transparent;color:#dce9f5;min-height:58px;padding:4px 2px;font-size:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}.mobile-bottom button b{font-size:19px;line-height:1}.mobile-bottom button.active{background:#1769aa;color:white}
 #offlineStatus{font-size:10px!important;padding:5px 8px!important;min-height:0!important}
}
@media(min-width:751px){.mobile-bottom{display:none!important}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
function addBottom(){if(document.querySelector('.mobile-bottom'))return;const bar=document.createElement('div');bar.className='mobile-bottom no-print';bar.innerHTML='<button data-mob="home"><b>⌂</b>الرئيسية</button><button data-mob="purchaseOrders"><b>▣</b>المشتريات</button><button data-mob="sales"><b>▤</b>المبيعات</button><button data-mob="accounts"><b>◉</b>الصندوق</button><button data-mob="backup"><b>▦</b>التقارير</button>';document.body.appendChild(bar);bar.addEventListener('click',e=>{const b=e.target.closest('[data-mob]');if(!b)return;const target=document.querySelector('nav button[data-page="'+b.dataset.mob+'"]');if(target)target.click();setActive(b.dataset.mob)});setActive('home')}
function setActive(page){document.querySelectorAll('.mobile-bottom button').forEach(b=>b.classList.toggle('active',b.dataset.mob===page))}
document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b&&b.dataset.page)setActive(b.dataset.page)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addBottom);else addBottom();
})();