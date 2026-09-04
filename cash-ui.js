(() => {
'use strict';
if (!/\/index\.html$/.test(location.pathname) && !location.pathname.endsWith('/albayan-accounting/')) return;
const c=n=>Math.round((Number(n)||0)*100), fmt=n=>(Number(n)||0).toLocaleString('ar-IQ',{maximumFractionDigits:2})+' د.ع';
function install(){
 const nav=document.querySelector('nav');const main=document.querySelector('main');if(!nav||!main||document.getElementById('cash'))return;
 const btn=document.createElement('button');btn.type='button';btn.dataset.cashPage='1';btn.textContent='الصندوق';nav.appendChild(btn);
 const sec=document.createElement('section');sec.id='cash';sec.hidden=true;sec.innerHTML='<h2>الصندوق</h2><div class="cards"><div class="card"><span>مقبوض مبيعات · د.ع</span><strong id="cashSales">0</strong></div><div class="card"><span>تسديدات الزبائن · د.ع</span><strong id="cashPayments">0</strong></div><div class="card"><span>إجمالي المقبوض · د.ع</span><strong id="cashTotal">0</strong></div></div><div class="panel"><h3>آخر المقبوضات</h3><div class="scroll"><table><thead><tr><th>التاريخ</th><th>البيان</th><th>الزبون</th><th>المبلغ</th></tr></thead><tbody id="cashRows"></tbody></table></div></div>';main.appendChild(sec);
 function rows(){const sales=(state?.invoices||[]).filter(v=>!v.cancelled&&Number(v.paid)>0).map(v=>({date:v.date||'',text:'فاتورة بيع رقم '+(v.number||''),customer:v.customer||'',amount:Number(v.paid)||0}));const pays=(state?.accounts||[]).filter(a=>(a.note||'').trim()==='تسديد من الزبون'&&Number(a.owedTo)>0).map(a=>({date:a.date||'',text:'تسديد من زبون',customer:a.customer||'',amount:Number(a.owedTo)||0}));return {sales,pays,all:[...sales,...pays].sort((a,b)=>b.date.localeCompare(a.date))}}
 function draw(){const r=rows(),s=r.sales.reduce((n,x)=>n+c(x.amount),0)/100,p=r.pays.reduce((n,x)=>n+c(x.amount),0)/100;document.getElementById('cashSales').textContent=fmt(s);document.getElementById('cashPayments').textContent=fmt(p);document.getElementById('cashTotal').textContent=fmt((c(s)+c(p))/100);document.getElementById('cashRows').innerHTML=r.all.slice(0,100).map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.text)+'</td><td>'+esc(x.customer)+'</td><td>'+fmt(x.amount)+'</td></tr>').join('')||'<tr><td colspan="4" class="empty">لا توجد مقبوضات بعد.</td></tr>'}
 btn.addEventListener('click',()=>{document.querySelectorAll('main>section').forEach(s=>s.hidden=true);sec.hidden=false;document.querySelectorAll('nav button').forEach(b=>b.removeAttribute('aria-current'));btn.setAttribute('aria-current','page');draw()});
 const base=typeof render==='function'?render:null;if(base){window.render=function(){const x=base.apply(this,arguments);if(!sec.hidden)draw();return x}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();