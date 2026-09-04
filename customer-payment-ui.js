(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
function install(){
 const form=document.getElementById('accountForm');
 if(!form||document.getElementById('quickCustomerPayment'))return;
 const actions=form.querySelector('.actions');
 if(!actions)return;
 const b=document.createElement('button');
 b.type='button';b.id='quickCustomerPayment';b.textContent='تسجيل تسديد من زبون';
 actions.appendChild(b);
 b.addEventListener('click',()=>{
  const name=document.getElementById('customer');
  const owedTo=document.getElementById('owedTo');
  const owedBy=document.getElementById('owedBy');
  const note=document.getElementById('note');
  const date=document.getElementById('date');
  if(date&&!date.value&&typeof localDate==='function')date.value=localDate();
  if(owedBy)owedBy.value='0';
  if(owedTo){owedTo.value='';owedTo.focus()}
  if(note&&!note.value)note.value='تسديد من الزبون';
  if(typeof notify==='function')notify(name?.value.trim()?'أدخل مبلغ التسديد ثم اضغط حفظ الحركة.':'اختر أو اكتب اسم الزبون، ثم أدخل مبلغ التسديد واحفظ الحركة.');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();