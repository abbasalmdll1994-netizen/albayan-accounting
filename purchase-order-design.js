(()=>{'use strict';
function openPurchases(e){const target=e.target.closest('[data-page="purchaseOrders"]');if(!target)return;e.preventDefault();e.stopImmediatePropagation();location.href='purchases.html?v=release-20260905-2';}
function setup(){document.addEventListener('click',openPurchases,true);const nav=document.querySelector('nav [data-page="purchaseOrders"]');if(nav){nav.textContent='المشتريات';nav.removeAttribute('aria-current');}if(location.hash==='#purchaseOrders')location.replace('purchases.html?v=release-20260905-2');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();