'use strict';
const one=(s,root=document)=>root.querySelector(s);
const all=(s,root=document)=>[...root.querySelectorAll(s)];
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const cad=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'});
const money=c=>cad.format(c/100);
const cents=value=>{const s=String(value).trim();if(!/^\d{1,7}(\.\d{1,2})?$/.test(s))throw new Error('Enter prices without commas or currency symbols, using up to two decimals.');const [a,b='']=s.split('.');return +a*100+Number(b.padEnd(2,'0'));};
const button=(id,text,cls='')=>'<button type="button" id="'+id+'" class="'+cls+'">'+text+'</button>';
const catalog={
 scope:['ScopeNote','01 · TRADE WORKFLOW','Reuse a change order and text the customer a price.','Save repeat work as a template, then price it and ask the customer to approve.'],
 bid:['BidPlain','02 · HOMEOWNER TOOL','See when the cheaper quote costs more.','Compare known costs and get a separate set of questions for each contractor.'],
 upstream:['Upstream Ledger','03 · SOFTWARE BRIEF','See what shipped and what’s still unverified.','Read verified Paxeer and Sidiora samples, save a watchlist and export a brief.'],
 trade:['TradeStack','04 · DEVELOPER KIT','Generate a release queue from public GitHub data.','Run a public repo through the Release Watch workflow. This browser version previews the downloadable kit.'],
 meter:['MeterCheck','05 · PAYMENT SANDBOX','Check what should happen for a paid API request.','Run a full simulated request, inspect the checks, and export a report. No wallet or live endpoint is contacted.']
};
const specimens={
 scope:`<div class="receipt"><div class="receipt-top"><b>CHANGE ORDER</b><span>CO–001</span></div><strong>Kitchen renovation</strong><p><span>Labour</span><b>$500.00</b></p><p><span>Materials</span><b>$375.00</b></p><div class="receipt-total"><span>Total · CAD</span><strong>$875.00</strong></div></div>`,
 bid:`<div class="compare"><div><span>QUOTE A</span><strong>$20,800</strong><small>KNOWN COST</small></div><div><span>QUOTE B</span><strong>$20,100</strong><small>KNOWN COST</small></div></div>`,
 upstream:`<div class="dispatch"><span>22 NOV 2026 / PAXEER</span><strong>Launchpad CI</strong><div><i>✓ Code merged</i><i>○ Live change unverified</i></div></div>`,
 trade:`<div class="branches"><span>nodejs / node</span><div><b>2b365b2</b> lib: SuppressedError</div><div><b>07b0481</b> test: update WPT</div><div><b>5b8b4ee</b> deps: ada 4.1.1</div></div>`,
 meter:`<div class="terminal"><div><span>SIMULATION</span><b>01 / 07</b></div><strong><i>✓</i> Paywall cleared</strong><div><span>NETWORK / RECIPIENT / AMOUNT</span></div></div>`
};
let active='home', mounted=false;
function toolLink(id,cls){
 const a=node('a',undefined,cls);a.href='#'+id;a.dataset.tool=id;
 if(cls==='tile'){
  const preview=node('div',undefined,'specimen');preview.setAttribute('aria-hidden','true');preview.innerHTML=specimens[id];
  const info=node('div',undefined,'tile-copy');
  info.append(node('span',catalog[id][1],'tile-id'),node('strong',catalog[id][0],'tile-name'),node('small',catalog[id][2]));
  const arrow=node('span','↗','tile-arrow');arrow.setAttribute('aria-hidden','true');
  a.append(preview,info,arrow);
 }else a.textContent=catalog[id][0];
 return a;
}
for(const id of Object.keys(catalog)){
 one(id==='scope'?'#featured':'#tiles').append(toolLink(id,'tile'));
 one('#tool-nav').append(toolLink(id,'nav-link'));
}
function readStore(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function writeStore(key,value){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function download(name,data,type='text/plain'){
 const url=URL.createObjectURL(new Blob([data],{type}));const a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function copyText(value,fallback,feedback){
 try{await navigator.clipboard.writeText(value);feedback.textContent='Copied.';}
 catch{const r=document.createRange();r.selectNodeContents(fallback);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);feedback.textContent='Text selected. Use your device’s Copy command.';}
}
function toolHead(id){const [name,flag,,detail]=catalog[id];return '<div class="tool-head"><p class="kicker">'+flag+'</p><h2 tabindex="-1" id="tool-heading">'+name+'</h2><p>'+detail+'</p></div>';}
function mount(){
 const hash=location.hash.slice(1);active=Object.hasOwn(catalog,hash)?hash:'home';
 one('#home-view').hidden=active!=='home';one('#tool-view').hidden=active==='home';
 for(const a of all('#tool-nav a')){
  if(a.hash==='#'+active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 }
 if(active!=='home'){
  one('#pane').dataset.tool=active;
  one('#pane').innerHTML=toolHead(active);
  ({scope,bid,upstream,trade,meter})[active]();
  one('#tool-heading').focus({preventScroll:true});
  const current=one('#tool-nav [aria-current]');
  if(current)one('#tool-nav').scrollLeft=Math.max(0,current.offsetLeft-(one('#tool-nav').clientWidth-current.offsetWidth)/2);
 }else if(hash==='tools'){
  const shelf=one('#tools');
  shelf.focus({preventScroll:true});
  shelf.scrollIntoView({block:'start',behavior:mounted&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'auto'});
  mounted=true;
  return;
 }else if(mounted){one('#home-title').focus({preventScroll:true});}
 mounted=true;
 window.scrollTo(0,0);
}
window.addEventListener('hashchange',mount);
function printPanel(){document.body.classList.add('printing');window.addEventListener('afterprint',()=>document.body.classList.remove('printing'),{once:true});window.print();}
function scope(){
 const starter={job:'Kitchen renovation',company:'',customer:'Sample homeowner',scope:'Relocate the sink supply and drain to the island. Countertop cutting is excluded.',timing:'Adds one working day after approval.',tax:'0',lines:[['Labour',2,'250'],['Materials',1,'375']]};
 const pane=one('#pane');pane.insertAdjacentHTML('beforeend',`
 <div class="panel template-panel"><h3>Start from a template</h3><p class="muted">Templates reuse the work, schedule and line items. They leave the current job, customer, business name and tax alone.</p>
 <div class="template-grid"><div><label>Saved or starter template<select id="scope-template"></select></label><div class="bar">${button('template-use','Use template','dark')}${button('template-delete','Delete saved template')}</div></div>
 <div><label>Name this template<input id="template-name" maxlength="40" placeholder="e.g. Extra fixture"></label><div class="bar">${button('template-save','Save current work as template')}</div></div></div>
 <p id="template-status" role="status" class="feedback"></p></div>
 <div class="cols split"><form id="scope-form" class="panel"><h3>Change details</h3>
 <div class="pair"><label>Job label<input name="job" maxlength="100" required></label><label>Customer (optional)<input name="customer" maxlength="100"></label></div>
 <label>Your business name for the request (optional)<input name="company" maxlength="100"></label><label>Work included and excluded<textarea name="scope" maxlength="500" required></textarea></label><label>Schedule impact<input name="timing" maxlength="150" required></label>
 <div id="scope-lines"></div>${button('scope-add','Add line item')}<div class="bar"><label>Sales tax % (0 if already included or not added)<input name="tax" inputmode="decimal" maxlength="5" required></label></div>
 <div class="bar"><button class="dark" type="submit">Generate note</button>${button('scope-example','Load example')}</div>
 <div class="bar">${button('draft-save','Save draft on this device')}${button('draft-load','Load saved draft')}${button('draft-clear','Delete saved draft')}</div><p id="scope-status" role="status" class="feedback"></p>
 </form><div class="panel print-panel"><h3>Approval request</h3><pre id="scope-report"></pre><div class="bar">${button('scope-copy','Copy full note')}${button('scope-text','Copy customer text','dark')}${button('scope-download','Download text')}${button('scope-print','Print / save PDF')}</div><details id="scope-text-details"><summary>Preview customer text</summary><pre id="scope-message"></pre></details><p class="muted">This is a request. It does not record a customer’s approval.</p><p id="scope-export" class="feedback" role="status"></p></div></div>`);
 const form=one('#scope-form'), lines=one('#scope-lines'), report=one('#scope-report'), status=one('#scope-status'), feedback=one('#scope-export');
 let output='', shortText='';
 const message=one('#scope-message');
 const templateKey='ot-lab-scope-templates-v1';
 const starters=[
  {name:'Move a fixture',scope:'Move the fixture to the agreed opening. Wall, floor and cabinet repairs are excluded.',timing:'Confirm the timing before starting.',lines:[['Labour',1,''],['Materials',1,'']]},
  {name:'Customer upgrade',scope:'Supply and fit the upgraded item agreed with the customer. The price below covers the change from the original item.',timing:'Confirm any change to the delivery date before starting.',lines:[['Upgrade price difference',1,''],['Additional installation labour',1,'']]},
  {name:'Unforeseen repair',scope:'Repair the issue found during work in the area described below. Any further hidden damage requires a separate approval.',timing:'Confirm the repair schedule before starting.',lines:[['Repair labour',1,''],['Repair materials',1,'']]}
 ];
 let savedTemplates=readStore(templateKey,[]);
 const validTemplate=t=>t&&['name','scope','timing'].every(k=>typeof t[k]==='string')&&Array.isArray(t.lines)&&t.lines.length>0&&t.lines.length<=10&&t.lines.every(l=>Array.isArray(l)&&l.length===3);
 savedTemplates=Array.isArray(savedTemplates)?savedTemplates.filter(validTemplate).slice(0,8):[];
 const menu=one('#scope-template'), templateStatus=one('#template-status'), deleteTemplate=one('#template-delete');
 const selectedTemplate=()=>{const [kind,index]=menu.value.split(':');return (kind==='saved'?savedTemplates:starters)[Number(index)];};
 const setMenu=(value='starter:0')=>{
  menu.replaceChildren(...[['Starters','starter',starters],['My templates','saved',savedTemplates]].filter(x=>x[2].length).map(([label,id,values])=>{
   const group=node('optgroup');group.label=label;
   values.forEach((t,i)=>{const option=node('option',t.name);option.value=id+':'+i;group.append(option);});return group;
  }));
  menu.value=value;deleteTemplate.disabled=!menu.value.startsWith('saved:');
 };
 setMenu();
 menu.onchange=()=>{deleteTemplate.disabled=!menu.value.startsWith('saved:');templateStatus.textContent='';};
 const actions=['#scope-copy','#scope-text','#scope-download','#scope-print'].map(sel=>one(sel));
 const get=()=>({job:form.job.value.trim(),customer:form.customer.value.trim(),company:form.company.value.trim(),scope:form.scope.value.trim(),timing:form.timing.value.trim(),tax:form.tax.value.trim(),lines:all('.row',lines).map(row=>all('input',row).map(i=>i.value.trim()))});
 function invalidate(){output='';shortText='';report.textContent='Details changed. Generate a new note.';message.textContent='Generate a note to see the text.';actions.forEach(b=>b.disabled=true);}
 function add(values=['','1','']){
  if(lines.children.length>=10){status.textContent='Limit of 10 line items.';return;}
  const row=node('div',undefined,'row');
  ['Item','Qty','Unit price CAD'].forEach((label,i)=>{
   const wrap=node('label',label);const input=node('input');input.value=String(values[i]??'');input.maxLength=i===0?90:10;input.required=true;
   if(i)input.inputMode=i===1?'numeric':'decimal';
   wrap.append(input);row.append(wrap);
  });
  const remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Remove line item');
  remove.addEventListener('click',()=>{if(lines.children.length===1){status.textContent='Keep at least one line item.';return;}row.remove();invalidate();});
  row.append(remove);lines.append(row);
 }
 function load(v,{template=false}={}){
  const fields=template?['scope','timing']:['job','customer','company','scope','timing','tax'];
  for(const key of fields)form[key].value=v[key]??'';
  lines.replaceChildren();(v.lines?.length?v.lines:starter.lines).slice(0,10).forEach(add);invalidate();feedback.textContent='';
 }
 one('#template-use').onclick=()=>{
  const t=selectedTemplate();
  if(t){load(t,{template:true});templateStatus.textContent='Template applied. Review the wording, quantities and prices.';form.scope.focus();}
 };
 one('#template-save').onclick=()=>{
  const name=one('#template-name').value.trim(), v=get();
  if(!name||!v.scope||!v.timing||!v.lines.some(([label])=>label)){templateStatus.textContent='Add a template name, work description, schedule and at least one named item.';return;}
  if(savedTemplates.some(t=>t.name.toLowerCase()===name.toLowerCase())){templateStatus.textContent='That template name is already in use. Choose a new name.';return;}
  if(savedTemplates.length>=8){templateStatus.textContent='You can save up to eight templates. Delete one to make room.';return;}
  const next=[...savedTemplates,{name,scope:v.scope,timing:v.timing,lines:v.lines}];
  if(!writeStore(templateKey,next)){templateStatus.textContent='This browser could not save your template.';return;}
  savedTemplates=next;setMenu('saved:'+(next.length-1));one('#template-name').value='';templateStatus.textContent='Template saved in this browser.';
 };
 deleteTemplate.onclick=()=>{
  const index=Number(menu.value.slice(6)), next=savedTemplates.filter((_,i)=>i!==index);
  if(!menu.value.startsWith('saved:'))return;
  if(!writeStore(templateKey,next)){templateStatus.textContent='This browser could not delete your template.';return;}
  savedTemplates=next;setMenu();templateStatus.textContent='Template deleted.';
 };
 function generate(){
  try{
   const v=get();if(!v.job||!v.scope||!v.timing)throw new Error('Add the job, scope and schedule impact.');
   const tax=cents(v.tax);if(tax>10000)throw new Error('Tax must be a percentage between 0 and 100.');
   const priced=v.lines.map(([label,qty,price])=>{
    if(!label||!/^\d{1,4}$/.test(qty)||Number(qty)<1)throw new Error('Each line needs a label and a whole quantity from 1 to 9,999.');
    const each=cents(price);return {label,qty,each,total:each*Number(qty)};
   });
   const sub=priced.reduce((sum,r)=>sum+r.total,0);
   if(sub>10000000000)throw new Error('Keep the subtotal at or below CAD $100,000,000.');
   const taxValue=Math.round(sub*tax/10000);
   output=['Request to approve extra work',...(v.company?['From: '+v.company]:[]),v.job,...(v.customer?['For: '+v.customer]:[]),'',v.scope,'',...priced.map(item=>item.label+': '+item.qty+' × '+money(item.each)+' = '+money(item.total)), 'Subtotal: '+money(sub),'Additional tax: '+money(taxValue)+' ('+v.tax+'%)','Total: '+money(sub+taxValue),'','Schedule: '+v.timing,'','Please reply in writing to approve the price, scope and schedule before this extra work begins.'].join('\n');
   shortText=['Hi'+(v.customer?' '+v.customer:'')+', here’s the proposed change for '+v.job+':',v.scope,'Total: '+money(sub+taxValue)+' CAD'+(taxValue?' (includes '+v.tax+'% tax)' : '')+'.','Schedule: '+v.timing,'Please reply to approve the scope, price and schedule before this work starts.',...(v.company?[v.company]:[])].join('\n\n');
   report.textContent=output;message.textContent=shortText;actions.forEach(b=>b.disabled=false);status.textContent='Note ready.';feedback.textContent='';
  }catch(err){invalidate();status.textContent=err.message;}
 }
 form.addEventListener('submit',e=>{e.preventDefault();generate();});
 form.addEventListener('input',()=>{if(output)invalidate();status.textContent='';feedback.textContent='';});
 one('#scope-add').onclick=()=>{add();invalidate();};
 one('#scope-example').onclick=()=>{load(starter);generate();};
 one('#draft-save').onclick=()=>{status.textContent=writeStore('ot-lab-scope-draft',get())?'Draft saved on this device.':'Your browser could not save the draft.';};
 one('#draft-load').onclick=()=>{const v=readStore('ot-lab-scope-draft',null);if(v){load(v);status.textContent='Draft loaded.';}else status.textContent='No draft has been saved on this device.';};
 one('#draft-clear').onclick=()=>{status.textContent=writeStore('ot-lab-scope-draft',null)?'Saved draft deleted.':'Your browser could not delete the draft.';};
 one('#scope-text').onclick=()=>{one('#scope-text-details').open=true;copyText(shortText,message,feedback);};
 one('#scope-copy').onclick=()=>copyText(output,report,feedback);
 one('#scope-download').onclick=()=>download('scopenote-approval-request.txt',output+'\n');
 one('#scope-print').onclick=printPanel;
 load(starter);generate();
}
function bid(){
 one('#pane').insertAdjacentHTML('beforeend',`<div class="panel"><h3>Two quotes in, a comparison out</h3><p>See the kitchen example, then enter your quotes. You can copy each contractor’s questions separately and save one comparison on this device.</p><a class="button dark" href="bidplain.html">Open the quote workspace ↗</a></div>`);
}
const issues=[
 {id:'1122',date:'Nov. 22, 2026',name:'Launchpad: frontend CI check changed',status:'Merged code · live change unverified',
  summary:'A Launchpad merge changed a frontend CI test. The test requires a separate lint script if lint is skipped during the build.',
  check:'Two public RPC endpoints answered on chain 125 at blocks 47,542,155 and 47,542,154 when sampled. That is a read check, not evidence of broad access or payment support.',
  action:'If you depend on this build, verify the published release or deployment before changing production settings.',
  links:[['Source commit','https://github.com/Sidiora-Labs/paxeer-monorepo/commit/76286a9ccfd3c4659d9cf3740b4d0b82d0d9e724'],['Network FAQ','https://www.paxeer.network/faq']]},
 {id:'1121',date:'Nov. 21, 2026',name:'Launchpad: profit-and-loss tracker test',status:'Merged test · live change unverified',
  summary:'The Launchpad profit-and-loss tracker test changed to use registered database definitions and replay chain logs. A separate commit marked a related test task done.',
  check:'The commits establish what landed in the repository. They do not establish that a new tracker version is running.',
  action:'If your app uses the tracker, wait for release or deployment evidence before changing your settings.',
  links:[['Test change','https://github.com/Sidiora-Labs/paxeer-monorepo/commit/eb02f3102eb2cae2e8a387f8c6f7bc6e33836329'],['Task update','https://github.com/Sidiora-Labs/paxeer-monorepo/commit/ce9dbd71efafe429abad6ec89bff8760b87495fb']]}
];
function upstream(){
 const pane=one('#pane');pane.insertAdjacentHTML('beforeend',`
 <div class="cols split"><div class="panel"><h3>Read a sample issue</h3><div id="issue-list" class="stack issue-list"></div>
 <hr><h3>My watchlist</h3><p class="muted">Saved on this browser only. It does not subscribe you to email.</p>
 <form id="watch-form"><label>Public GitHub repo<input id="watch-repo" placeholder="owner/repo" maxlength="130" required></label><button class="dark" type="submit">Add repo</button></form><div id="watch-items" class="stack bar"></div><p id="watch-status" class="feedback" role="status"></p>
 </div><div class="panel print-panel"><p class="muted" id="issue-date"></p><h3 id="issue-title"></h3><p class="status-line" id="issue-status"></p><p id="issue-summary"></p><p id="issue-check"></p><p><strong>What to do: </strong><span id="issue-action"></span></p><div class="issue-sources" id="issue-sources"></div><div class="bar">${button('issue-export','Download brief')}</div></div></div>`);
 let watch=readStore('ot-lab-watchlist',[]);if(!Array.isArray(watch))watch=[];
 let selected=issues[0];
 function show(issue){
  selected=issue;for(const key of ['date','status','summary','check','action'])one('#issue-'+key).textContent=issue[key];
  one('#issue-title').textContent=issue.name;
  one('#issue-sources').replaceChildren(...issue.links.map(([name,url])=>{const a=node('a',name);a.href=url;return a;}));
  all('#issue-list button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===issue.id)));
 }
 for(const issue of issues){const item=node('button',issue.date+' · '+issue.name);item.type='button';item.dataset.id=issue.id;item.onclick=()=>show(issue);one('#issue-list').append(item);}
 function list(){
  one('#watch-items').replaceChildren(...watch.map(name=>{
   const b=node('button','Remove '+name);b.type='button';b.onclick=()=>{
    watch=watch.filter(v=>v!==name);one('#watch-status').textContent=writeStore('ot-lab-watchlist',watch)?'Removed '+name+'.':'Removed for this session.';list();
   };return b;
  }));
 }
 one('#watch-form').onsubmit=e=>{
  e.preventDefault();
  try{const name=repoName(one('#watch-repo').value);if(watch.some(v=>v.toLowerCase()===name.toLowerCase()))throw new Error('This repo is already on your list.');
   if(watch.length>=5)throw new Error('Save up to five repos.');
   watch.push(name);one('#watch-repo').value='';one('#watch-status').textContent=writeStore('ot-lab-watchlist',watch)?'Saved '+name+'.':'Added for this session.';list();
  }catch(err){one('#watch-status').textContent=err.message;}
 };
 one('#issue-export').onclick=()=>download('upstream-ledger-'+selected.id+'.txt',[selected.date,selected.name,selected.status,'',selected.summary,selected.check,'What to do: '+selected.action,'',...selected.links.map(x=>x.join(': '))].join('\n')+'\n');
 show(selected);list();
}
function repoName(raw){
 const s=String(raw).trim().replace(/^https:\/\/github\.com\//i,'').replace(/\/$/,'');
 if(!/^[a-z\d_.-]{1,90}\/[a-z\d_.-]{1,100}$/i.test(s)||s.split('/').some(x=>x==='..'||x==='.'))throw new Error('Enter a public GitHub repo as owner/repo.');
 return s;
}
function trade(){
 one('#pane').insertAdjacentHTML('beforeend',`
 <div class="cols split"><form class="panel" id="trade-form"><h3>Build a release queue</h3>
 <label>Public GitHub repo<input id="trade-repo" maxlength="130" value="pallets/flask" required></label>
 <label>Look back<select id="trade-window"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
 <div class="bar"><button class="dark" type="submit" id="trade-run">Fetch GitHub data</button>${button('trade-sample','Load verified sample')}</div>
 <p class="muted">This contacts GitHub from your browser. No token is requested. Public API limits may leave gaps.</p><p class="feedback" role="status" id="trade-feedback"></p>
 </form><div class="panel print-panel"><div class="bar"><h3>Review queue</h3><span class="pill" id="trade-kind"></span></div><p class="muted" id="trade-range"></p><p class="feedback error" id="trade-gaps"></p><div id="trade-items" class="stack"></div><div class="bar">${button('trade-export','Download Markdown')}</div></div></div>`);
 const selector=s=>one(s,one('#pane'));
 const form=selector('#trade-form'), repo=selector('#trade-repo'), windowField=selector('#trade-window'), run=selector('#trade-run');
 const sampleButton=selector('#trade-sample'), kind=selector('#trade-kind'), range=selector('#trade-range'),
 gaps=selector('#trade-gaps'), items=selector('#trade-items'), exportButton=selector('#trade-export'), feedback=selector('#trade-feedback');
 let report;
 const sample={repo:'nodejs/node',mode:'SAVED SAMPLE',range:'Nov. 15–21, 2026 UTC · excerpt',gaps:['GitHub release pagination reached its cap; release coverage is incomplete.'],entries:[
  {date:'2026-11-21',label:'Default-branch commit',name:'lib: legitimize SuppressedError as primordial',url:'https://github.com/nodejs/node/commit/2b365b28928d9ab36f1e9b41f81beaca83fa772a'},
  {date:'2026-11-21',label:'Default-branch commit',name:'test: update WPT for url',url:'https://github.com/nodejs/node/commit/07b0481f495415cca2e12a4b5b52cddbe00556b4'},
  {date:'2026-11-21',label:'Default-branch commit',name:'deps: update ada to 4.1.1',url:'https://github.com/nodejs/node/commit/5b8b4ee64eb0a64ac010b7082833719291b8c997'}]};
 function show(next){
  report=next;kind.textContent=next.mode;range.textContent=next.repo+' · '+next.range;
  gaps.textContent=next.gaps.length?'Coverage gaps: '+next.gaps.join(' '):'';
  items.replaceChildren(...next.entries.slice(0,30).map(item=>{
   const entry=node('article',undefined,'feed-item');const header=node('p',item.date+' · '+item.label,'muted');const a=node('a',item.name);a.href=item.url;
   entry.append(header,a);return entry;
  }));
  if(!next.entries.length)items.append(node('p','No matching items captured for this period.','muted'));
  if(next.entries.length>30)items.append(node('p','Showing 30 of '+next.entries.length+' entries. The download includes all captured entries.','muted'));
  exportButton.disabled=false;
 }
 async function collect(ownerRepo,type,start,end,signal){
  const found=[];let more=false;const alerts=[];
  for(let page=1;page<=3;page++){
   const query=new URLSearchParams({per_page:'30',page:String(page)});
   if(type==='commits'){query.set('since',start);query.set('until',end);}
   const u='https://api.github.com/repos/'+ownerRepo+'/'+type+'?'+query;
   const res=await fetch(u,{signal,headers:{Accept:'application/vnd.github+json'}});
   if(!res.ok)throw new Error(res.status===403||res.status===429?'GitHub rate limit or access restriction.':'GitHub returned '+res.status+'. Use a public repository.');
   const json=await res.json();
   if(!Array.isArray(json))throw new Error('GitHub did not return a list.');
   const link=res.headers.get('link');more=link!==null?/rel="next"/.test(link):json.length===30;
   for(const item of json){
    const release=type==='releases';
    if(release&&item.draft)continue;
    const date=release?item.published_at:item.commit?.committer?.date;
    const url=item.html_url;
    if(typeof date!=='string'||date<start||date>=end||typeof url!=='string'||!url.startsWith('https://github.com/'))continue;
    found.push({date:date.slice(0,10),label:release?(item.prerelease?'Prerelease':'Published release'):'Default-branch commit',name:String(release?(item.name||item.tag_name||'Untitled release'):(item.commit?.message||'Untitled commit')).split('\n')[0].slice(0,220),url});
   }
   if(!more)break;
  }
  if(more)alerts.push(type+': page limit reached.');
  return {found,alerts};
 }
 form.onsubmit=async e=>{
  e.preventDefault();
  if(run.disabled)return;
  let key;try{key=repoName(repo.value);}catch(err){feedback.textContent=err.message;return;}
  const end=new Date();const start=new Date(+end-Number(windowField.value)*86400000);
  const bound=d=>d.toISOString().replace(/\.\d{3}Z$/,'Z');
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),13000);
  run.disabled=true;sampleButton.disabled=true;feedback.textContent='Checking public GitHub data…';exportButton.disabled=true;
  try{
   const types=['releases','commits'];const results=await Promise.allSettled(types.map(type=>collect(key,type,bound(start),bound(end),ctrl.signal)));
   const entries=[], warnings=[];
   results.forEach((result,i)=>{if(result.status==='fulfilled'){entries.push(...result.value.found);warnings.push(...result.value.alerts);}else warnings.push(types[i]+': '+(result.reason?.name==='AbortError'?'request timed out.':result.reason?.message||'source unavailable.'));});
   const seen=new Set();
   const unique=entries.filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;}).sort((a,b)=>b.date.localeCompare(a.date));
   show({repo:key,mode:'LIVE GITHUB',range:bound(start).slice(0,10)+' to '+bound(end).slice(0,10)+' UTC',entries:unique,gaps:warnings});
   feedback.textContent=warnings.length?'Queue ready with coverage gaps.':'Queue ready.';
  }finally{clearTimeout(timeout);run.disabled=false;sampleButton.disabled=false;}
 };
 sampleButton.onclick=()=>{show(sample);feedback.textContent='Saved sample loaded.';};
 exportButton.onclick=()=>{
  if(!report)return;
  const asText=s=>String(s).replace(/[\r\n]+/g,' ').replace(/[\[\]<>]/g,'');
  const text=['# Release Watch · '+report.repo,report.range,'',...report.gaps.map(s=>'Coverage gap: '+asText(s)),'',...report.entries.map(item=>'- '+item.date+' · '+item.label+' · '+asText(item.name)+' · '+item.url)].join('\n')+'\n';
  download('tradestack-release-queue.md',text,'text/markdown');
 };
 show(sample);
}
function meter(){
 const fixtures={
  valid:['Confirmed and matches','confirmed',true,true,true,true],
  pending:['Payment pending','pending',true,true,true,true],
  wrong:['Wrong amount','confirmed',true,true,false,true],
  chain:['Wrong network','confirmed',false,true,true,true],
  recipient:['Wrong recipient','confirmed',true,false,true,true],
  replay:['Already used receipt','confirmed',true,true,true,false],
  down:['Verification unavailable','unavailable',null,null,null,null]
 };
 one('#pane').insertAdjacentHTML('beforeend',`
 <div class="cols split"><form id="meter-form" class="panel"><h3>Configure a simulation</h3>
 <label>Expected amount (demo units)<input value="0.05" id="meter-amount" maxlength="10" inputmode="decimal" required></label>
 <label>Scenario<select id="meter-case"></select></label><button class="dark" type="submit">Run simulation</button><p class="feedback" role="status" id="meter-feedback"></p>
 <hr><h3>This session</h3><div id="meter-history" class="stack"></div><div class="bar">${button('meter-clear','Clear run history')}</div></form>
 <div class="panel print-panel"><h3 id="meter-verdict"></h3><p class="muted" id="meter-route"></p><ol id="meter-checks" class="checks"></ol><p id="meter-guidance"></p><div class="bar">${button('meter-download','Download test report')}</div></div></div>`);
 const select=one('#meter-case'), status=one('#meter-feedback'), runs=[];let selected=null;
 for(const [key,fixture] of Object.entries(fixtures)){const o=node('option',fixture[0]);o.value=key;select.append(o);}
 function display(result){
  selected=result;one('#meter-verdict').textContent=result.verdict;one('#meter-route').textContent=result.route;
  one('#meter-checks').replaceChildren(...result.checks.map(check=>node('li',check)));
  one('#meter-guidance').textContent=result.guidance;one('#meter-download').disabled=false;
 }
 function history(){
  one('#meter-history').replaceChildren(...runs.map((record,i)=>{
   const b=node('button',(runs.length-i)+'. '+record.caseName);b.type='button';b.onclick=()=>display(record);return b;
  }));
  if(!runs.length)one('#meter-history').append(node('p','No runs yet.','muted'));
 }
 function go(){
  let amount;
  try{amount=cents(one('#meter-amount').value);if(amount<=0)throw new Error('Enter a positive expected amount.');}
  catch(err){status.textContent=err.message;return;}
  const f=fixtures[select.value];
  let verdict='Paywall cleared',route='SIMULATED RESULT · Return paid response',guidance='A confirmed receipt matches the demo offer and can be accepted once.';
  if(f[1]==='unavailable'){verdict='Verification unavailable';guidance='Retry verification later without asking the customer to pay again.';}
  else if(f[1]==='pending'){verdict='Payment pending';guidance='Wait for confirmation. The customer should not resend the payment.';}
  else if(!f[2]){verdict='Wrong network';guidance='Tell the customer which network the offer expects. Hold the paid response.';}
  else if(!f[3]){verdict='Recipient mismatch';guidance='The receipt pays a different recipient from the offer. Hold the paid response.';}
  else if(!f[4]){verdict='Amount mismatch';guidance='Show the expected and received amounts. Hold the paid response.';}
  else if(!f[5]){verdict='Receipt already used';guidance='Do not unlock a second request with this receipt.';}
  if(verdict!=='Paywall cleared')route='SIMULATED RESULT · Hold paid response';
  const mark=x=>x===null?'Not checked':x?'Matches':'Mismatch';
  const amountText=(amount/100).toFixed(2);
  const checks=['Receipt status: '+f[1],'Network: '+mark(f[2]),'Recipient: '+mark(f[3]),
   'Amount expected: '+amountText+' demo units'+(f[4]===null?' (not checked)':f[4]?' (matches)':'; fixture amount '+((amount+1)/100).toFixed(2)),
   'Receipt previously used: '+(f[5]===null?'Not checked':f[5]?'No':'Yes')];
  const result={caseName:f[0],verdict,route,checks,guidance};
  runs.unshift(result);if(runs.length>10)runs.pop();display(result);history();status.textContent='Run recorded.';
 }
 one('#meter-form').onsubmit=e=>{e.preventDefault();go();};
 one('#meter-clear').onclick=()=>{
  runs.length=0;selected=null;history();one('#meter-verdict').textContent='Run a simulation';one('#meter-route').textContent='';
  one('#meter-checks').replaceChildren();one('#meter-guidance').textContent='';one('#meter-download').disabled=true;status.textContent='Run history cleared.';
 };
 one('#meter-download').onclick=()=>{if(selected)download('metercheck-simulation.txt',['MeterCheck simulation',selected.caseName,selected.verdict,selected.route,'',...selected.checks,'',selected.guidance].join('\n')+'\n');};
 go();
}
mount();
