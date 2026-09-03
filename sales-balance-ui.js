(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
function install(){
 const customer=document.getElementById('saleCustomer'),totals=document.getElementById('saleTotals');
 if(!customer||!totals||document.getElementById('salePreviousBalance'))return;
 const style=document.createElement('style');style.textContent='@media(max-width:750px){#salePreviousBalance{display:none!important}}';document.head.appendChild(style);
 const box=document.createElement('div');box.id='salePreviousBalance';box.className='notice';box.hidden=true;totals.before(box);
 function balance(){const name=customer.value.trim();if(!name||typeof allAccounts!=='function')return 0;const editId=typeof saleEdit!=='undefined'?saleEdit:null;return allAccounts().filter(a=>(a.customer||'').trim()===name&&(!editId||a.invoiceId!==editId)).reduce((s,a)=>s+(Number(a.owedBy)||0)-(Number(a.owedTo)||0),0)}
 function fmt(n){return Math.abs(n).toLocaleString('ar-IQ',{maximumFractionDigits:2})+' د.ع'}
 function render(){const b=balance();box.hidden=!b;if(b>0){box.textContent='الرصيد السابق على الزبون: '+fmt(b);box.dataset.balanceType='debt'}else if(b<0){box.textContent='رصيد للزبون لدينا: '+fmt(b);box.dataset.balanceType='credit'}else{box.textContent='';delete box.dataset.balanceType}}
 customer.addEventListener('input',render);customer.addEventListener('change',render);
 document.addEventListener('click',e=>{if(e.target.closest('[data-edit-sale]'))setTimeout(render,0)});
 const observer=new MutationObserver(render);observer.observe(totals,{childList:true,subtree:true,characterData:true});render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();