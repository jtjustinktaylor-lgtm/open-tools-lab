'use strict';
const $=selector=>document.querySelector(selector);
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
const toKey=value=>value.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const normalized=value=>value.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
const ideas=PITCH_IDEAS.map(([lane,name,buyer,pitch,model,test,reuse,added],i)=>({lane,name,buyer,pitch,model,test,reuse,added,id:toKey(name),num:i+1}));
const byId=new Map(ideas.map(i=>[i.id,i]));
const freshest=[...new Set(ideas.map(i=>i.added).filter(Boolean))].sort().reverse();
const lastBatch=freshest[0];
const formatDate=value=>new Intl.DateTimeFormat('en-CA',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
const picks=new Map([
 ['lastslot','A filled cancellation has a dollar value. Start with one groomer and a real opening; skip calendar integration.'],
 ['borrowboard','The first pilot can use one bag of loaner gear and a handful of printed labels. Watch for a second week of use.'],
 ['rainplan','One organizer already has the distribution channel. Test whether families use the link instead of asking for the latest update.'],
 ['pickupproof','Add pickup codes to a workflow we already built. Measure missed and duplicate pickups at one event.'],
 ['vendorready','Recurring fairs repeat the same instructions every time. Pilot with one organizer and count follow-ups.'],
 ['printproof','A print shop can measure proof delays and reprints. Start with one approval page and one shop.'],
 ['repairready','The customer needs an answer before calling. Start with status updates for ten repairs; skip integrations.']
]);
const firstOffers={
 lastslot:'Try $19 CAD per month per grooming shop after a cancellation is filled.',
 borrowboard:'Try $25 CAD per month for one shared gear inventory.',
 rainplan:'Try $39 CAD per season for a small league.',
 pickupproof:'Try $12 CAD for one pickup event.',
 vendorready:'Try $25 CAD for one market date with its vendor instructions and confirmations.',
 printproof:'Try $25 CAD per month for one print shop.',
 repairready:'Try $29 CAD per month for one service counter.'
};
const key='open-tools-pitchboard-shortlist-v1';
let saved=readSaved(), mode='all';
const list=$('#pitch-list'), search=$('#query'), lane=$('#lane'), model=$('#model'), clipboardStatus=$('#copy-status'), fallback=$('#copy-fallback');
const lanes=[...new Set(ideas.map(i=>i.lane))], models=[...new Set(ideas.map(i=>i.model))].sort();
const menu=(select,values)=>{for(const value of values)select.append(node('option',value));};
menu(lane,lanes);menu(model,models);
$('#folio-total').textContent=ideas.length;$('#folio-lanes').textContent=lanes.length+' BUSINESS LANES';
function readSaved(){try{const a=JSON.parse(localStorage.getItem(key));return new Set(Array.isArray(a)?a.filter(id=>byId.has(id)):[]);}catch{return new Set();}}
function store(){try{localStorage.setItem(key,JSON.stringify([...saved]));return true;}catch{return false;}}
function textList(){return mode==='picks'?[...picks.keys()].map(i=>byId.get(i)):mode==='saved'?[...saved].map(i=>byId.get(i)):mode==='latest'?ideas.filter(i=>i.added===lastBatch&&i.added):ideas;}
function filtered(){
 const words=normalized(search.value.trim()).split(/\s+/).filter(Boolean);
 return textList().filter(i=>{
  if((lane.value&&lane.value!==i.lane)||(model.value&&model.value!==i.model))return false;
  const s=normalized([i.name,i.lane,i.buyer,i.pitch,i.model,i.test,i.reuse].join(' '));
  return words.every(w=>s.includes(w));
 });
}
function refreshSavedCount(){
 $('#saved-count').textContent=saved.size;
 $('#copy-saved').disabled=!saved.size;
}
function styleSaved(button,i){
 const active=saved.has(i.id);
 button.textContent=active?'✓ Saved':'+ Save';
 button.setAttribute('aria-pressed',String(active));
 button.setAttribute('aria-label',(active?'Remove ':'Save ')+i.name+(active?' from shortlist':' to shortlist'));
}
function details(i){
 const details=node('details',undefined,'details');
 details.append(node('summary','Buyer, offer and test'));
 const dl=node('dl');
 const rows=[['Likely first buyer',i.buyer],['Business model to test',i.model],['First real-world test',i.test]];
 if(i.added)rows.push(['Added',formatDate(i.added)]);
 if(i.reuse)rows.push(['Start with',i.reuse+'’s existing workflow.']);
 if(picks.has(i.id))rows.push(['Why it made the cut',picks.get(i.id)],['Price hypothesis',firstOffers[i.id]]);
 for(const [term,value] of rows)dl.append(node('dt',term),node('dd',value));
 details.append(dl);return details;
}
function row(i){
 const li=node('li',undefined,'pitch'), n=node('span',String(i.num).padStart(2,'0'),'number'), main=node('div',undefined,'pitch-main'), chips=node('div',undefined,'chips');
 n.setAttribute('aria-hidden','true');
 chips.append(node('span',i.lane,'chip'),node('span',i.model,'chip'));
 if(picks.has(i.id))chips.append(node('span','Quick-start pick','chip pick'));
 if(i.added&&i.added===lastBatch)chips.append(node('span','Latest batch','chip pick'));
 main.append(chips,node('h3',i.name),node('p',i.pitch,'pitch-copy'),details(i));
 const b=node('button',undefined,'save');b.type='button';styleSaved(b,i);
 b.onclick=()=>{
  if(saved.has(i.id))saved.delete(i.id);else saved.add(i.id);
  const persisted=store();
  refreshSavedCount();
  clipboardStatus.textContent=persisted?'':'This browser could not save your changes after reload.';
  if(mode==='saved'){
   const idx=[...list.children].indexOf(li);
   render();
   (list.children[Math.min(idx,list.children.length-1)]?.querySelector('button')||$('#view-saved')).focus();
  }else styleSaved(b,i);
 };
 li.append(n,main,b);return li;
}
function queryIsSet(){return Boolean(search.value.trim()||lane.value||model.value);}
function render(){
 const output=filtered(), total=textList().length;
 refreshSavedCount();
 list.replaceChildren(...output.map(row));
 $('#summary').textContent=mode==='all'?output.length+' of '+ideas.length+' ideas':output.length+' of '+total+(mode==='picks'?' quick-start picks':mode==='latest'?' latest additions':' saved');
 $('#short-tools').hidden=mode!=='saved';
 fallback.hidden=true;
 for(const tab of ['all','picks','latest','saved'])$('#view-'+tab).setAttribute('aria-pressed',String(mode===tab));
 $('#reset').disabled=!queryIsSet();
 const empty=$('#empty');empty.hidden=output.length>0;empty.replaceChildren();
 if(output.length===0){
  empty.append(node('p',mode==='saved'&&saved.size===0?'Nothing saved yet. Use + Save next to any pitch to add it here.':'No matches. Try a shorter search or clear a filter.'));
  if(mode==='saved'&&saved.size===0){const all=node('button','Browse all ideas');all.type='button';all.onclick=()=>setMode('all',true,true);empty.append(all);}
 }
}
function reset(){search.value='';lane.value='';model.value='';}
function setMode(value,clear=false,jump=false){
 mode=value;if(clear)reset();clipboardStatus.textContent='';render();
 if(jump){const title=$('#work-title');title.focus({preventScroll:true});title.scrollIntoView({block:'start'});}
}
search.oninput=render;lane.onchange=render;model.onchange=render;
$('#reset').onclick=()=>{reset();render();search.focus();};
for(const tab of ['all','picks','latest','saved'])$('#view-'+tab).onclick=()=>setMode(tab,true);
$('#hero-saved').onclick=()=>setMode('saved',true,true);
$('#top-picks').onclick=()=>setMode('picks',true,true);
$('#copy-saved').onclick=async()=>{
 const out=['My shortlist · The Pitch List','',...[...saved].map((id,n)=>{
  const i=byId.get(id);
  return (n+1)+'. '+i.name+' — '+i.pitch+'\nLikely buyer: '+i.buyer+' | Model: '+i.model+'\nFirst test: '+i.test+(firstOffers[i.id]?'\nPrice hypothesis: '+firstOffers[i.id]:'');
 })].join('\n\n');
 if(!saved.size)return;
 try{await navigator.clipboard.writeText(out);clipboardStatus.textContent='Shortlist copied.';fallback.hidden=true;}
 catch{fallback.value=out;fallback.hidden=false;fallback.focus();fallback.select();clipboardStatus.textContent='Shortlist selected. Use your device’s Copy command.';}
};
render();
