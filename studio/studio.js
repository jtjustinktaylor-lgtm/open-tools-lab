'use strict';
const at=s=>document.querySelector(s);
const root=at('#root');
const products={
 plan:{name:'PlanWatch',audience:'For agencies and small teams',pitch:'See what a price hike costs your team.',description:'Compare old and new software plans, including paid seats and fixed fees. Get the annual impact and a decision brief you can share before renewal.',specimen:['DESIGN WORKSPACE / EXAMPLE','+$840 / year','Seat rates and fixed fees in one brief','RENEWAL REVIEW'],offer:'Managed price watch',paid:'A paid pilot could track public pricing pages for a team’s chosen vendors and deliver a reviewed alert when something actually changes.'},
 guest:{name:'GuestPack',audience:'For podcasters and interview hosts',pitch:'Give your guest one place to get ready.',description:'Turn recording details, prep notes and links into a clean guest brief. Copy it into an email or export a standalone page.',specimen:['THE WEEKLY SIGNAL','You’re booked.','Tuesday · 2:00 p.m. ET','GUEST BRIEF'],offer:'Branded show workspace',paid:'A paid pilot could give a weekly show reusable branding, a private place to collect guest materials, and reminders before recording.'},
 returns:{name:'Return Clock',audience:'For online shoppers',pitch:'Catch the return window while it’s open.',description:'Keep the last return date and an earlier nudge in your calendar. Enter the exact retailer deadline or calculate a provisional one from the order or delivery date.',specimen:['ONLINE ORDER / EXAMPLE','3 days to act','Calendar nudge before the final day','RETURN WINDOW'],offer:'Household return tracker',paid:'Start free. A possible paid version would share deadlines across a household; test repeat use before adding a subscription.'},
 bid:{name:'BidPlain',audience:'For people comparing renovation quotes',pitch:'See what the cheaper quote leaves out.',description:'Enter two estimates and add known extras. See when the cheaper quote flips and get a separate text to send to each contractor.',specimen:['KITCHEN QUOTES / EXAMPLE','$700 more','After adding the priced extras to the cheaper quote','QUOTE COMPARISON'],path:'../v4/bidplain.html',cta:'Compare two quotes',offer:'Shareable comparison report',paid:'Keep the comparison free. Test demand for a polished report that homeowners can share when deciding together.'},
 scope:{name:'ScopeNote',audience:'For contractors and small crews',pitch:'Price the extra. Get it in writing.',description:'Reuse change order templates, add the total and timing, then send a clear approval request by text or as a PDF.',specimen:['CHANGE ORDER / EXAMPLE','$875.00 CAD','Move the kitchen sink to the island','READY TO REVIEW'],path:'../v4/#scope',cta:'Write a change order',offer:'Crew template pack',paid:'A paid pack could add trade-specific templates and a consistent company layout for crews that send change orders every week.'}
};
function clean(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function el(tag,txt,cls){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;}
function preview([label,stat,detail,chip],id){
 return '<div aria-hidden="true" class="specimen '+id+'"><div class="specimen-inner"><span class="tag">'+label+'</span><strong class="stat">'+stat+'</strong><small>'+detail+'</small><span class="chip">'+chip+'</span></div></div>';
}
function home(){
 root.innerHTML='<section class="hero"><p class="tag">The product collection / 01–05</p><h1>Take one thing off your list.</h1><p class="intro">Five tools for decisions that cost time or money. Try each one with an example, then put it to work.</p></section><div class="shelf">'+Object.entries(products).map(([id,p])=>'<a class="card" href="?product='+id+'">'+preview(p.specimen,id)+'<div class="card-copy"><span class="tag">'+p.audience+'</span><h2>'+p.name+'</h2><p>'+p.pitch+'</p></div><span class="arrow" aria-hidden="true">↗</span></a>').join('')+'</div>';
}
function product(id){
 const p=products[id];document.title=p.name+' | Open Tools Studio';
 root.innerHTML='<section class="product-hero '+id+'"><div class="hero-text"><p class="tag">'+p.audience+'</p><h1>'+p.name+'</h1><h3 class="intro">'+p.pitch+'</h3><p class="intro">'+p.description+'</p><div class="actions"><a class="button" href="'+(p.path||'#workbench')+'">'+(p.cta||'Try the tool')+' <span aria-hidden="true">&nbsp;↗</span></a></div></div>'+preview(p.specimen,id)+'</section><div class="demo '+id+'" id="workbench"></div>';
 const work=at('#workbench');
 if(!p.path){
  const example=el('a','See the example','button secondary');
  example.href='#example-result';
  at('.product-hero .actions').append(example);
 }
 if(id==='plan')plan(work);else if(id==='guest')guest(work);else if(id==='returns')returnsClock(work);
 work.insertAdjacentHTML('beforeend','<aside class="panel full offer"><p class="tag">Business concept · Free preview today</p><h2>'+p.offer+'</h2><p>'+p.paid+'</p></aside>');
}
function store(key){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:[];}catch{return [];}}
function save(key,list){try{localStorage.setItem(key,JSON.stringify(list));return true;}catch{return false;}}
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copy(value,output,status){
 try{await navigator.clipboard.writeText(value);status.textContent='Copied.';}
 catch{output.focus({preventScroll:true});const r=document.createRange();r.selectNodeContents(output);const sel=window.getSelection();if(sel){sel.removeAllRanges();sel.addRange(r);}status.textContent='Text selected. Use your device’s Copy command.';}
}
const dollars=(c,currency)=>new Intl.NumberFormat('en-CA',{style:'currency',currency,currencyDisplay:'code'}).format(c/100);
const cents=raw=>{const s=raw.trim();if(!/^\d{1,6}(\.\d{1,2})?$/.test(s))throw Error('Use non-negative prices with up to two decimal places.');const [head,tail='']=s.split('.');return Number(head)*100+Number(tail.padEnd(2,'0'));};
const slug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'example';
const info=(id,value)=>`<p class="status" role="status" id="${id}">${value||''}</p>`;
const textResult=(id)=>`<pre class="report" tabindex="0" id="${id}"></pre>`;
function plan(work){
 work.innerHTML=`<form class="panel" id="plan-form"><h2>Compare two prices</h2>
 <label>Software or plan <input name="vendor" maxlength="70" value="Design workspace" required></label>
 <div class="pair"><label>Currency<select name="currency"><option>CAD</option><option>USD</option><option>GBP</option><option>EUR</option></select></label><label>Paid seats<input name="seats" type="number" min="1" max="100000" step="1" value="10" required></label></div>
 <div class="pair"><label>Old monthly price / seat<input name="oldSeat" inputmode="decimal" maxlength="9" value="24" required></label><label>New monthly price / seat<input name="newSeat" inputmode="decimal" maxlength="9" value="29" required></label></div>
 <div class="pair"><label>Old fixed monthly fee<input name="oldBase" inputmode="decimal" maxlength="9" value="0" required></label><label>New fixed monthly fee<input name="newBase" inputmode="decimal" maxlength="9" value="20" required></label></div>
 <label>Source or plan change (optional)<input name="source" maxlength="190" placeholder="Pricing URL, notice, or new limits"></label>
 <button type="submit">Calculate impact</button>${info('plan-input-status')}
 <p class="hint">Use the same currency and tax basis on both sides. This preview uses your inputs and does not monitor vendors.</p></form>
 <section class="panel result" id="example-result"><h2>Renewal brief</h2>${textResult('plan-output')}
 <div class="actions"><button id="plan-copy" type="button">Copy brief</button><button class="secondary" id="plan-save" type="button">Save to watchlist</button></div>${info('plan-status')}</section>
 <section class="panel full"><h2>Watchlist</h2><p class="hint">Saved comparisons in this browser. Reopen one when you have a new price.</p><ul class="saved" id="plan-list"></ul></section>`;
 const form=at('#plan-form'), output=at('#plan-output'), status=at('#plan-status'), inputStatus=at('#plan-input-status'), copyButton=at('#plan-copy'), saveButton=at('#plan-save');
 const key='ot-studio-plan-v1', names=['vendor','currency','seats','oldSeat','newSeat','oldBase','newBase','source'];
 const field=name=>form.elements.namedItem(name);
 let result=null, saved=store(key).filter(row=>row&&names.every(n=>typeof row[n]==='string')).slice(0,25);
 function refresh(){
  const list=at('#plan-list');list.replaceChildren();
  if(!saved.length)list.append(el('li','No saved comparisons yet.','hint'));
  saved.forEach((row,i)=>{
   const item=el('li'), actions=el('div',undefined,'actions'), open=el('button','Open '+row.vendor,'secondary'), del=el('button','Remove '+row.vendor,'secondary');open.type=del.type='button';
   open.onclick=()=>{for(const name of names)field(name).value=row[name];calculate();field('vendor').focus();};
   del.onclick=()=>{const next=saved.filter((_,j)=>j!==i);if(save(key,next)){saved=next;refresh();status.textContent='Removed from watchlist.';}else status.textContent='Could not update this browser’s watchlist.';};
   item.append(el('p',row.vendor+' · '+row.currency),actions);actions.append(open,del);list.append(item);
  });
 }
 function invalidate(){result=null;output.textContent='Calculate to update the brief.';copyButton.disabled=saveButton.disabled=true;status.textContent='';}
 function calculate(){
  invalidate();inputStatus.textContent='';
  try{
   const row=Object.fromEntries(names.map(name=>[name,field(name).value.trim()]));const count=Number(row.seats);
   if(!row.vendor||!Number.isInteger(count)||count<1||count>100000)throw Error('Enter a software name and 1 to 100,000 paid seats.');
   const old=cents(row.oldSeat)*count+cents(row.oldBase), next=cents(row.newSeat)*count+cents(row.newBase), delta=next-old;
   const money=value=>dollars(value,row.currency);
   const title=delta>0?'Increase: '+money(delta*12)+' per year':delta<0?'Savings: '+money(-delta*12)+' per year':'No price change';
   const pct=old>0?' ('+new Intl.NumberFormat('en-CA',{style:'percent',maximumFractionDigits:1,signDisplay:'exceptZero'}).format(delta/old)+')':'';
   output.textContent=[title,row.vendor+' · '+count+' paid seat'+(count===1?'':'s'),'',money(old)+' → '+money(next)+' per month'+pct,'Annual run rate: '+money(old*12)+' → '+money(next*12),...(row.source?['','Source / plan notes: '+row.source]:[]),'','Estimate assumes the same number of seats for 12 months.'].join('\n');
   result=row;copyButton.disabled=saveButton.disabled=false;
  }catch(e){inputStatus.textContent=e.message;}
 }
 form.oninput=()=>{invalidate();inputStatus.textContent='';};form.onsubmit=e=>{e.preventDefault();calculate();};
 copyButton.onclick=()=>copy(output.textContent,output,status);
 saveButton.onclick=()=>{
  if(!result)return;
  const next=[result,...saved.filter(row=>row.vendor.toLowerCase()!==result.vendor.toLowerCase())];
  if(next.length>25){status.textContent='Remove a comparison to save another.';return;}
  if(save(key,next)){saved=next;refresh();status.textContent='Saved to this browser’s watchlist.';}else status.textContent='This browser could not save the comparison.';
 };
 refresh();calculate();
}
function guest(work){
 work.innerHTML=`<form class="panel" id="guest-form"><h2>Set up the recording</h2>
 <label>Show or series <input name="show" maxlength="70" value="The Weekly Signal" required></label>
 <div class="pair"><label>Guest name <input name="guest" maxlength="65" value="Casey" required></label><label>Episode or topic <input name="topic" maxlength="90" value="Making a first episode" required></label></div>
 <div class="pair"><label>Recording date <input name="date" type="date" required></label><label>Time and time zone <input name="time" maxlength="70" value="2:00 p.m. Eastern" required></label></div>
 <label>Recording room link (optional) <input name="room" type="url" maxlength="400" placeholder="https://…"></label>
 <label>How to send bio, headshot or links (optional) <input name="assets" maxlength="180" value="Reply to my invite with a short bio and your preferred headshot."></label>
 <label>What to prepare <textarea name="prep" maxlength="600" required>Bring one story about recording your first episode. Join five minutes early and have headphones handy.</textarea></label>
 <button type="submit">Build guest brief</button>${info('guest-input-status')}</form>
 <section class="panel result" id="example-result"><h2>Guest brief</h2>${textResult('guest-output')}
 <div class="actions"><button id="guest-copy" type="button">Copy invite text</button><button class="secondary" id="guest-export" type="button">Download guest page</button><button class="secondary" id="guest-save" type="button">Save draft</button><button class="secondary" id="guest-delete" type="button">Delete saved draft</button></div>
 <p class="hint">The download is an HTML file you can share. Drafts stay in this browser. This preview doesn’t host pages, collect files, or send messages.</p>${info('guest-status')}</section>`;
 const form=at('#guest-form'), output=at('#guest-output'), status=at('#guest-status'), inputStatus=at('#guest-input-status'), copyButton=at('#guest-copy'), exp=at('#guest-export'), saveButton=at('#guest-save'), deleteButton=at('#guest-delete');
 const key='ot-studio-guest-v1';
 const names=['show','guest','topic','date','time','room','assets','prep'];
 const field=name=>form.elements.namedItem(name);
 const start=store(key)[0];field('date').value=shift(localToday(),7);
 if(start&&names.every(n=>typeof start[n]==='string'))for(const name of names)field(name).value=start[name];
 let result=null;deleteButton.disabled=!start;
 const safeURL=value=>{if(!value)return '';let u;try{u=new URL(value);}catch{throw Error('Enter a full recording URL beginning with https://.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Use an HTTPS recording link without embedded login details.');return u.href;};
 function invalidate(){result=null;output.textContent='Build a brief to preview your edits.';copyButton.disabled=exp.disabled=saveButton.disabled=true;status.textContent='';}
 function calculate(){
  invalidate();inputStatus.textContent='';
  try{
   const v=Object.fromEntries(names.map(name=>[name,field(name).value.trim()]));
   if(!['show','guest','topic','time','prep'].every(n=>v[n])||!validDate(v.date))throw Error('Fill in the show, guest, topic, recording date, time and prep notes.');
   const link=safeURL(v.room), when=pretty(v.date)+' · '+v.time;
   result={v,link,when};
   output.textContent=['Hi '+v.guest+',','You’re booked for '+v.show+'.','','Topic: '+v.topic,'Recording: '+when,...(link?['Room: '+link]:[]),'','Prep: '+v.prep,...(v.assets?['','Guest materials: '+v.assets]:[]),'','See you there!'].join('\n');
   copyButton.disabled=exp.disabled=saveButton.disabled=false;
  }catch(e){inputStatus.textContent=e.message;}
 }
 form.oninput=()=>{invalidate();inputStatus.textContent='';};form.onsubmit=e=>{e.preventDefault();calculate();};
 copyButton.onclick=()=>copy(output.textContent,output,status);
 exp.onclick=()=>{
  if(!result)return;
  const {v,link,when}=result;
  const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+clean(v.show)+' · Guest Brief</title><style>body{margin:0;background:#eee3ff;color:#302047;font:17px/1.5 system-ui}main{max-width:650px;margin:40px auto;padding:24px}h1{font-size:clamp(2.5rem,7vw,4.2rem);letter-spacing:-.06em;line-height:1}section{background:#fffdfb;border-radius:16px;padding:18px;margin:10px 0}p{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#522b87}</style><main><p>'+clean(v.show)+'</p><h1>See you soon, '+clean(v.guest)+'.</h1><section><h2>'+clean(v.topic)+'</h2><p>'+clean(when)+'</p>'+(link?'<a href="'+clean(link)+'" rel="noreferrer">Open the recording room</a>':'')+'</section><section><h2>What to prepare</h2><p>'+clean(v.prep)+'</p>'+(v.assets?'<h2>Guest materials</h2><p>'+clean(v.assets)+'</p>':'')+'</section></main></html>';
  download(slug(v.show)+'-guest-brief.html',html,'text/html;charset=utf-8');
 };
 saveButton.onclick=()=>{if(result&&save(key,[result.v])){status.textContent='Draft saved in this browser.';deleteButton.disabled=false;}else status.textContent='This browser could not save the draft.';};
 deleteButton.onclick=()=>{if(save(key,[])){status.textContent='Saved draft removed. Current fields are still open.';deleteButton.disabled=true;}else status.textContent='This browser could not remove the draft.';};
 calculate();
}
function validDate(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'1900-01-01'||s>'9999-12-31')return false;
 const d=new Date(s+'T00:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===s;
}
function localToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function shift(date,days){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function pretty(date){return new Intl.DateTimeFormat('en-CA',{dateStyle:'long',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));}
function dayDiff(a,b){return Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);}
function escapeIcs(s){return s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function foldIcs(line){
 const enc=new TextEncoder(), pieces=[];let piece='', count=0;
 for(const c of line){const n=enc.encode(c).length;if(count+n>75){pieces.push(piece);piece=' ';count=1;}piece+=c;count+=n;}
 pieces.push(piece);return pieces.join('\r\n');
}
function returnsClock(work){
 work.innerHTML=`<form class="panel" id="returns-form"><h2>Set the return window</h2>
 <label>Item <input name="item" maxlength="100" value="Running shoes" required></label>
 <label>Store (optional) <input name="retailer" maxlength="65" value="Example store"></label>
 <div class="pair"><label>Order or delivery date <input name="received" type="date"></label><label>Return window in days <input name="window" type="number" min="1" max="365" value="30"></label></div>
 <label>Exact return deadline, if provided <input name="deadline" type="date"></label>
 <label>Days before deadline to add an early calendar entry <select name="lead"><option value="1">1 day</option><option value="3" selected>3 days</option><option value="7">7 days</option><option value="0">No early entry</option></select></label>
 <button type="submit">Calculate deadline</button>${info('returns-input-status')}
 <p class="hint">If there’s no exact date, use the date your retailer starts counting from. We add the stated number of calendar days. Confirm cutoffs and exceptions with the retailer.</p></form>
 <section class="panel result" id="example-result"><h2>Return plan</h2>${textResult('returns-output')}
 <div class="actions"><button id="returns-calendar" type="button">Download calendar events</button><button class="secondary" id="returns-save" type="button">Save in this browser</button></div>
 <p class="hint">Import the .ics file into your calendar. Calendar notifications depend on your device settings; this site doesn’t send alerts.</p>${info('returns-status')}</section>
 <section class="panel full"><h2>Saved returns</h2><p class="hint">Your saved items stay on this browser.</p><ul id="returns-list" class="saved"></ul></section>`;
 const form=at('#returns-form'), output=at('#returns-output'), status=at('#returns-status'), inputStatus=at('#returns-input-status'), calendar=at('#returns-calendar'), saveButton=at('#returns-save');
 const key='ot-studio-returns-v1', names=['item','retailer','received','window','deadline','lead'], field=name=>form.elements.namedItem(name);
 let result=null,saved=store(key).filter(x=>x&&validDate(x.due)&&x.v&&names.every(n=>typeof x.v[n]==='string')).slice(0,30);
 field('received').value=shift(localToday(),-20);
 function remain(due){const n=dayDiff(due,localToday());return n<0?'Deadline passed':n===0?'Due today':n+' day'+(n===1?'':'s')+' to act';}
 function refresh(){
  const list=at('#returns-list');list.replaceChildren();
  if(!saved.length)list.append(el('li','No saved returns yet.','hint'));
  saved.forEach((record,i)=>{
   const item=el('li'), actions=el('div',undefined,'actions'), open=el('button','Open '+record.v.item,'secondary'), del=el('button','Remove '+record.v.item,'secondary');open.type=del.type='button';
   open.onclick=()=>{for(const name of names)field(name).value=record.v[name];calculate();field('item').focus();};
   del.onclick=()=>{const next=saved.filter((_,j)=>j!==i);if(save(key,next)){saved=next;refresh();status.textContent='Removed saved return.';}else status.textContent='Could not update the saved returns.';};
   item.append(el('p',record.v.item+' · '+pretty(record.due)+' · '+remain(record.due)),actions);actions.append(open,del);list.append(item);
  });
 }
 function invalidate(){result=null;output.textContent='Calculate to update your return plan.';calendar.disabled=saveButton.disabled=true;status.textContent='';}
 function syncDeadline(){const exact=Boolean(field('deadline').value);field('received').disabled=exact;field('window').disabled=exact;}
 function calculate(){
  syncDeadline();invalidate();inputStatus.textContent='';
  try{
   const v=Object.fromEntries(names.map(name=>[name,field(name).value.trim()]));
   if(!v.item)throw Error('Name the item you might return.');
   const days=Number(v.window), lead=Number(v.lead);
   if(!v.deadline&&(!validDate(v.received)||!Number.isInteger(days)||days<1||days>365))throw Error('Enter a valid start date and a 1–365 day window, or enter the exact deadline.');
   const due=v.deadline||shift(v.received,days);
   if(!validDate(due)||due>'9999-12-30')throw Error('Enter a valid deadline between 1900 and 9999.');
   const earlyDate=lead?shift(due,-lead):'', early=earlyDate&&validDate(earlyDate)&&earlyDate>=localToday()?earlyDate:'';
   output.textContent=[remain(due),v.item+(v.retailer?' · '+v.retailer:''),'','Return by: '+pretty(due)+(v.deadline?' (date entered)':' (estimated)'),...(early?['Early calendar entry: '+pretty(early)]:lead?['Early date has already passed. Only the deadline will export.']:[]),...(!v.deadline?['','Check the actual deadline with the retailer before relying on this date.']:[])].join('\n');
   result={v,due,early};calendar.disabled=saveButton.disabled=false;
  }catch(e){inputStatus.textContent=e.message;}
 }
 form.oninput=()=>{syncDeadline();invalidate();inputStatus.textContent='';};form.onsubmit=e=>{e.preventDefault();calculate();};
 calendar.onclick=()=>{
  if(!result)return;
  const {v,due,early}=result, created=new Date().toISOString().replace(/[-:]|\.\d{3}/g,''), events=[[due,'Return deadline: '+v.item]];
  if(early)events.unshift([early,'Check return plans: '+v.item]);
  const description=(v.retailer?v.retailer+'. ':'')+(v.deadline?'Deadline entered by you.':'Estimated date. Verify the actual retailer deadline.');
  const stamp=s=>s.replace(/-/g,'');
  const data=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Open Tools Studio//Return Clock//EN','CALSCALE:GREGORIAN',...events.flatMap(([date,title],i)=>[
   'BEGIN:VEVENT','UID:'+crypto.randomUUID()+'-'+i+'@return-clock','DTSTAMP:'+created,'DTSTART;VALUE=DATE:'+stamp(date),'DTEND;VALUE=DATE:'+stamp(shift(date,1)),'SUMMARY:'+escapeIcs(title),'DESCRIPTION:'+escapeIcs(description),'TRANSP:TRANSPARENT','END:VEVENT'
  ]),'END:VCALENDAR',''].map(foldIcs).join('\r\n');
  download(slug(v.item)+'-return.ics',data,'text/calendar;charset=utf-8');status.textContent='Calendar file ready. Open it in your calendar to add the dates.';
 };
 saveButton.onclick=()=>{
  if(!result)return;
  const {v,due}=result, next=[{v,due},...saved.filter(x=>!(x.v.item.toLowerCase()===v.item.toLowerCase()&&x.v.retailer.toLowerCase()===v.retailer.toLowerCase()&&x.due===due))];
  if(next.length>30){status.textContent='Remove a saved return to make room.';return;}
  if(save(key,next)){saved=next;refresh();status.textContent='Return saved in this browser.';}else status.textContent='This browser could not save the return.';
 };
 refresh();calculate();
}
const route=new URLSearchParams(location.search).get('product');
if(Object.hasOwn(products,route))product(route);else home();
