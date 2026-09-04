(() => {
  'use strict';
  const base = new URL('./', document.currentScript.src);
  function loadScript(name,mark){
    if(document.querySelector('script['+mark+']')) return;
    const script=document.createElement('script');
    script.src=new URL(name,base).href;
    script.setAttribute(mark,'1');
    document.head.appendChild(script);
  }
  function init() {
    loadScript('mobile-ui.js?v=release-20260904-11','data-mobile-ui');
    loadScript('sales-payment-ui.js?v=release-20260904-5','data-sales-payment-ui');
    loadScript('sales-balance-ui.js?v=release-20260904-3','data-sales-balance-ui');
    loadScript('sales-print-ui.js?v=release-20260904-2','data-sales-print-ui');
    loadScript('purchase-list-ui.js?v=release-20260904-2','data-purchase-list-ui');
    if (window.self !== window.top) return;
    const bar = document.createElement('div');
    bar.id = 'offlineStatus';
    bar.className = 'no-print';
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'padding:10px 16px;background:#eef6f0;color:#174c32;font:14px/1.7 Tahoma,Arial;display:flex;flex-wrap:wrap;align-items:center;gap:10px';
    const label = document.createElement('span');
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = 'إعادة المحاولة'; retry.hidden = true;
    bar.append(label, retry); document.body.prepend(bar);
    const style = document.createElement('style'); style.textContent = '@media print{#offlineStatus{display:none!important}}'; document.head.appendChild(style);
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {label.textContent = 'افتح البرنامج بمتصفح سامسونج أو Chrome لتجهيز العمل بدون إنترنت.';return;}
    let registration, failed = false;
    function render() {retry.hidden = !failed;if (navigator.serviceWorker.controller) {label.textContent = navigator.onLine ? 'جاهز للعمل بدون إنترنت · الحفظ على هذا الجهاز' : 'تعمل بدون إنترنت · الحفظ على هذا الجهاز؛ المزامنة تحتاج اتصالاً';if (registration?.waiting) label.textContent += ' · تحديث جاهز: احفظ شغلك وأغلق كل صفحات البرنامج ثم افتحه من جديد.';if (failed) label.textContent += ' · تعذّر تنزيل تحديث؛ النسخة الحالية باقية.';} else {label.textContent = failed ? 'لم يكتمل تجهيز العمل بدون إنترنت. اتصل بالإنترنت واضغط إعادة المحاولة.' : 'جارٍ تجهيز البرنامج للعمل بدون إنترنت… أبقِ الصفحة مفتوحة حتى يكتمل.';}}
    function watch(worker) {if (!worker) return;worker.addEventListener('statechange', () => {if (worker.state === 'redundant') failed = true;render();});}
    async function register() {failed = false;retry.disabled = true;render();try {registration = await navigator.serviceWorker.register(new URL('sw.js', base).href, {scope: base.pathname, updateViaCache: 'none'});watch(registration.installing);registration.addEventListener('updatefound', () => watch(registration.installing));render();} catch (_) {failed = true;render();} finally { retry.disabled = false; }}
    retry.addEventListener('click', register);navigator.serviceWorker.addEventListener('controllerchange', render);window.addEventListener('offline', render);window.addEventListener('online', () => { render(); register(); });register();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();