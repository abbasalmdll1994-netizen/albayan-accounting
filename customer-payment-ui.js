(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
const c=n=>Math.round((Number(n)||0)*100);
const fmt=n=>(Number(n)||0).toLocaleString('ar-IQ',{maximumFractionDigits:2})+' د.ع';
function customerBalance(name){
 if(!name||typeof allAccounts!=='function')return 0;
 return allAccounts().filter(a=>(a.customer||'').trim()===name.trim()).reduce((n,a)=>n+c(a.owedBy)-c(a.owedTo),0)/100;
}
function install(){
 const form=document.getElementById('accountForm');
 if(!form||document.getElementById('quickCustomerPayment'))return;
 const actions=form.querySelector('.actions');
 if(!actions)return;
 const name=document.getElementById('customer'), owedTo=document.getElementById('owedTo'), owedBy=document.getElementById('owedBy'), note=document.getElementById('note'), date=document.getElementById('date');
 const balance=document.createElement('p');balance.id='customerAccountBalance';balance.className='muted';balance.style.margin='10px 0 0';form.insertBefore(balance,actions);
 function refresh(){const n=name?.value.trim();const b=customerBalance(n);balance.textContent=!n?'':b>0?'الرصيد الحالي علينا استلامه من الزبون: '+fmt(b):b<0?'الرصيد الحالي للزبون عندنا: '+fmt(Math.abs(b)):'الرصيد الحالي: متعادل';}
 name?.addEventListener('input',refresh);name?.addEventListener('change',refresh);
 const b=document.createElement('button');b.type='button';b.id='quickCustomerPayment';b.textContent='تسجيل تسديد من زبون';actions.appendChild(b);
 b.addEventListener('click',()=>{if(date&&!date.value&&typeof localDate==='function')date.value=localDate();if(owedBy)owedBy.value='0';if(owedTo){owedTo.value='';owedTo.focus()}if(note&&!note.value)note.value='تسديد من الزبون';refresh();if(typeof notify==='function')notify(name?.value.trim()?'أدخل مبلغ التسديد ثم اضغط حفظ الحركة.':'اكتب اسم الزبون، ثم أدخل مبلغ التسديد واحفظ الحركة.');});
 form.addEventListener('submit',e=>{const n=name?.value.trim();const pay=Number(owedTo?.value)||0;const debt=customerBalance(n);const isPayment=(note?.value||'').trim()==='تسديد من الزبون'&&pay>0&&(Number(owedBy?.value)||0)===0;if(isPayment&&debt<=0){e.preventDefault();e.stopImmediatePropagation();if(typeof notify==='function')notify('هذا الزبون ما عليه رصيد مستحق لنا.');return}if(isPayment&&c(pay)>c(debt)){e.preventDefault();e.stopImmediatePropagation();if(typeof notify==='function')notify('مبلغ التسديد أكبر من رصيد الزبون الحالي: '+fmt(debt));}},true);
 document.addEventListener('click',e=>{const x=e.target.closest('[data-edit-account]');if(x)setTimeout(refresh,0)});refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();