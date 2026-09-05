(()=>{'use strict';
const $=id=>document.getElementById(id);
const css=`
#purchaseOrders>h2{font-size:30px;color:#123b63;margin-bottom:4px}
#purchaseOrders>h2:after{content:'  🛒'}
#purchaseOrders .po-approved-sub{color:#526579;font-size:18px;margin:0 0 16px}
#purchaseOrders .po-approved-count{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;background:#fff0f0;border:1px solid #ffcaca;border-radius:12px;padding:8px 22px;margin-bottom:14px;color:#8e1717}
#purchaseOrders .po-approved-count strong{font-size:26px;line-height:1.2}
#purchaseOrders .po-approved-table{overflow:auto;border:1px solid #d9e3ed;border-radius:12px;background:white}
#purchaseOrders .po-approved-table table{min-width:720px;white-space:normal}
#purchaseOrders .po-approved-table th{text-align:center;background:#eaf3fb;color:#123b63;font-size:15px}
#purchaseOrders .po-approved-table td{text-align:center;vertical-align:middle;padding:9px 8px}
#purchaseOrders .po-approved-table td.po-name{text-align:right;font-weight:700}
#purchaseOrders .po-stock{display:inline-block;min-width:72px;padding:7px 12px;border-radius:9px;background:#ffe5e5;color:#a01818;font-weight:700}
#purchaseOrders .po-qty{width:90px!important;min-height:40px;text-align:center!important;background:#f3f6f9;border-color:#cdd8e3;font-weight:700}
#purchaseOrders .po-accept,#purchaseOrders .po-reject{min-height:40px;padding:7px 18px;color:white;border:0;font-weight:700;margin:2px}
#purchaseOrders .po-accept{background:#159447}.po-accept:hover{background:#11783a!important}
#purchaseOrders .po-reject{background:#d93636}.po-reject:hover{background:#b92c2c!important}
#purchaseOrders .po-approved-actions{display:flex;gap:14px;margin-top:16px}
#purchaseOrders .po-approved-actions button{flex:1;font-size:16px;font-weight:700}
#purchaseOrders .po-save-all{background:#159447;color:#fff;border:0}.po-save-all:hover{background:#11783a!important}
#purchaseOrders .po-reject-all{background:#d93636;color:#fff;border:0}.po-reject-all:hover{background:#b92c2c!important}
#purchaseOrders #poForm>.grid,#purchaseOrders #poSuggestions,#purchaseOrders #savePurchaseOrder,#purchaseOrders .po-original-copy{display:none!important}
@media(max-width:750px){#purchaseOrders>h2{font-size:24px}#purchaseOrders .po-approved-actions{flex-direction:column}#purchaseOrders .po-approved-table table{min-width:650px}}
`;
function text(el){return (el?.textContent||'').trim()}
function setup(){const page=$('purchaseOrders'),form=$('poForm'),orig=$('poSuggestions');if(!page||!form||!orig)return;
 if(!$('poApprovedStyle')){const s=document.createElement('style');s.id='poApprovedStyle';s.textContent=css;document.head.appendChild(s)}
 const supplier=$('poSupplier'),note=$('poNote');if(supplier){supplier.required=false;if(!supplier.value)supplier.value='المخزون';}if(note)note.value='';
 [...form.children].forEach(el=>{if(el!==orig&&el.id!=='savePurchaseOrder'&&el.classList.contains('grid'))el.hidden=true});
 let ui=$('poApprovedUI');if(!ui){ui=document.createElement('div');ui.id='poApprovedUI';ui.innerHTML='<p class="po-approved-sub">الأصناف القليلة في المخزون</p><div class="po-approved-count"><strong id="poApprovedCount">0</strong><span>صنف بحاجة لطلب</span></div><div class="po-approved-table"><table><thead><tr><th>تسلسل</th><th>اسم الصنف</th><th>المخزون الحالي</th><th>الكمية المقترحة</th><th>إجراء</th></tr></thead><tbody id="poApprovedRows"></tbody></table></div><div class="po-approved-actions"><button type="button" class="po-save-all" id="poApproveSelected">اعتماد المحدد (إضافة إلى الطلبية)</button><button type="button" class="po-reject-all" id="poRejectSelected">رفض المحدد</button></div>';form.insertBefore(ui,orig);}
 render();
 const mo=new MutationObserver(()=>setTimeout(render,0));mo.observe(orig,{childList:true,subtree:true,attributes:true});
 $('poApproveSelected').onclick=()=>{$('savePurchaseOrder')?.click()};
 $('poRejectSelected').onclick=()=>{[...orig.querySelectorAll('button')].filter(b=>/رفض/.test(text(b))).forEach(b=>b.click())};
}
function render(){const orig=$('poSuggestions'),rows=$('poApprovedRows'),count=$('poApprovedCount');if(!orig||!rows)return;const cards=[...orig.querySelectorAll('.po-item')];count.textContent=cards.length;rows.innerHTML='';cards.forEach((card,i)=>{const buttons=[...card.querySelectorAll('button')],accept=buttons.find(b=>/قبول/.test(text(b))),reject=buttons.find(b=>/رفض/.test(text(b))),input=card.querySelector('input[type=number]');const strong=card.querySelector('strong');const all=text(card);let name=text(strong)||('صنف '+(i+1));let stock=(all.match(/الرصيد[^\d٠-٩]*([\d٠-٩]+)/)||all.match(/المخزون[^\d٠-٩]*([\d٠-٩]+)/)||[])[1]||'—';const tr=document.createElement('tr');tr.innerHTML=`<td>${i+1}</td><td class="po-name"></td><td><span class="po-stock">${stock}</span></td><td></td><td></td>`;tr.children[1].textContent=name;const q=input?input.cloneNode(true):document.createElement('input');q.type='number';q.className='po-qty';if(!q.value)q.value='1';q.oninput=()=>{if(input){input.value=q.value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}};tr.children[3].appendChild(q);const a=document.createElement('button');a.type='button';a.className='po-accept';a.textContent='قبول';a.onclick=()=>accept?.click();const r=document.createElement('button');r.type='button';r.className='po-reject';r.textContent='رفض';r.onclick=()=>reject?.click();tr.children[4].append(a,r);rows.appendChild(tr)});if(!cards.length)rows.innerHTML='<tr><td colspan="5" class="empty">لا توجد أصناف قليلة حاليًا.</td></tr>'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();