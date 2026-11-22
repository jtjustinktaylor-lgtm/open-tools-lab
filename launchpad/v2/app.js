'use strict';
const d=globalThis.LaunchDomain, $=s=>document.querySelector(s), root=$('#root');
const products={
 bench:{name:'BenchCall',label:'For rec team captains',desc:'Fill a last-minute opening with one link. Players can claim it from their phones, and the captain can see who’s in. If it fills, the next player can join as a backup.',cta:'Post a spot',sample:['THURSDAY HOCKEY','1 goalie needed','8:30 p.m. · East rink'],demo:{title:'Goalie needed · Thursday hockey',when:'Thursday, 8:30 p.m. Eastern',where:'East rink · Pad 2',note:'Arrive 15 minutes early. Bring your own goalie gear.',capacity:1,waitlist:true}},
 drop:{name:'DropDesk',label:'For bakers and small sellers',desc:'Post one pickup drop with a fixed number of items. Buyers reserve from the same stock count, so you know what to make.',cta:'Post a drop',sample:['WEEKEND PREORDERS','24 cinnamon boxes','Saturday pickup · Reservable'],demo:{title:'Saturday cinnamon boxes',when:'Saturday, noon–3 p.m. Eastern',where:'Downtown pickup · address shared by the seller',note:'Each box has four rolls. Pay at pickup. Contains wheat, milk and eggs.',capacity:24,price:'16.00',currency:'CAD'}},
 tag:{name:'ClaimTag',label:'For families, teams and clubs',desc:'Print a QR tag for a bag or piece of gear. A finder can leave a message without seeing the owner’s phone number or email.',cta:'Create a tag',sample:['FOUND ITEM','Hockey gear bag','Scan the tag → Report it'],demo:{title:'Blue hockey gear bag',note:'If found, tell me where you picked it up and how I can reach you.',capacity:100}}
};
let browserDemo=false;
const forcedDemo=new URLSearchParams(location.search).get('demo')==='1';
if(forcedDemo)for(const a of document.querySelectorAll('a[href="./"]'))a.href='?demo=1';
const stateKey='ot-launchpad-browser-demo-v2', recentKey=(forcedDemo||/\.github\.io$/i.test(location.hostname))?'ot-launchpad-demo-organizers-v2':'ot-launchpad-organizers-v1';
const random=(n)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join('');
const newId=()=>random(8);
const newReceipt=()=>random(16);
const money=(c,currency)=>new Intl.NumberFormat('en-CA',{style:'currency',currency,currencyDisplay:'code'}).format(c/100);
function el(tag,value,cls){const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e;}
function btn(label,fn,cls='secondary'){const b=el('button',label,cls);b.type='button';b.onclick=fn;return b;}
function anchor(label,href,cls){const a=el('a',label,cls);a.href=href;return a;}
function safeStore(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function persist(key,data){try{localStorage.setItem(key,JSON.stringify(data));return true;}catch{return false;}}
const sampleId=kind=>'sample-'+kind;
function demoStore(){
 const v=safeStore(stateKey,{});
 return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
}
function getDemo(db,id){
 if(Object.hasOwn(db,id))return db[id];
 const kind=id.startsWith('sample-')?id.slice(7):'';
 if(!Object.hasOwn(products,kind))throw d.error('This demo page only exists in the browser that created it.',404);
 return {...d.board({kind,...products[kind].demo}),id,closed:false,entries:[],secret:'example'};
}
async function request(method,path,body,secret){
 if(browserDemo){
  const db=demoStore();
  if(method==='POST'&&path===''){const b={...d.board(body),id:newId(),closed:false,entries:[],secret:newId()};db[b.id]=b;if(!persist(stateKey,db))throw d.error('This browser could not save your demo.');return {board:d.view(b,true),secret:b.secret};}
  const [id,sub]=path.slice(1).split('/'), b=getDemo(db,id);
  if(method==='GET'&&sub==='receipt')return {board:d.view(b),receipt:d.receipt(b,secret)};
  if(secret&&b.secret!==secret)throw d.error('That organizer link does not match this demo.',403);
  if(method==='GET')return {board:d.view(b,Boolean(secret))};
  if(method==='POST'&&sub==='entries'){
   const e=d.add(b,body,newId,newReceipt);
   db[id]=b;if(!persist(stateKey,db))throw d.error('This browser could not save your demo.');
   return {board:d.view(b),receiptKey:e.receiptKey,state:e.state};
  }
  if(method==='PATCH'&&secret){
   if(body.action==='delete'){delete db[id];if(!persist(stateKey,db))throw d.error('Could not reset the demo.');return {board:null};}
   d.adjust(b,body.action,body.entryId);
  }else throw d.error('Use your private organizer link.',403);
  db[id]=b;if(!persist(stateKey,db))throw d.error('This browser could not save your demo.');return {board:d.view(b,true)};
 }
 const headers={};if(body)headers['Content-Type']='application/json';if(secret)headers.Authorization='Bearer '+secret;
 const res=await fetch('api/boards'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await res.json();}catch{throw d.error('The shared service did not respond. Try again shortly.');}
 if(!res.ok)throw d.error(data.error||'The request failed.',res.status);
 return data;
}
function page(id,secret,receipt=false){
 const u=new URL('./',location.href);u.searchParams.set('board',id);if(forcedDemo)u.searchParams.set('demo','1');
 if(secret)u.hash=(receipt?'receipt=':'manage=')+encodeURIComponent(secret);
 return u.href;
}
function productUrl(kind){return '?product='+encodeURIComponent(kind)+(forcedDemo?'&demo=1':'');}
const field=(id,label,extra='')=>'<label>'+label+'<input name="'+id+'" '+extra+'></label>';
const notes=(label,extra='')=>'<label>'+label+'<textarea name="note" maxlength="420" '+extra+'></textarea></label>';
const status=(id='status')=>'<p class="status" role="status" id="'+id+'"></p>';
const pick=(form,names)=>Object.fromEntries(names.map(name=>[name,form.elements.namedItem(name)?.value||'']));
function art(kind,example=products[kind].sample){
 const outer=el('div',undefined,'art '+kind), inner=el('div',undefined,'sample');outer.setAttribute('aria-hidden','true');
 inner.append(el('span',example[0],'eyebrow'),el('b',example[1]),el('small',example[2]));outer.append(inner);return outer;
}
function head(kind,title,desc,label,example){
 document.title=title+' | Open Tools Launchpad';
 const top=el('section',undefined,'product '+kind), section=el('div',undefined,'intro');
 section.append(el('span',label||products[kind].label,'eyebrow'),el('h1',title),el('p',desc));top.append(section,art(kind,example));root.replaceChildren(top);return top;
}
function organizerList(){
 const rows=safeStore(recentKey,[]);
 return Array.isArray(rows)?rows.filter(x=>x&&typeof x.title==='string'&&/^[A-Za-z0-9_-]{16}$/.test(x.id)&&/^[A-Za-z0-9_-]{16,32}$/.test(x.secret)).slice(0,20):[];
}
function remember(b,secret){
 const recent=organizerList().filter(x=>x.id!==b.id);
 return persist(recentKey,[{title:b.title,id:b.id,secret},...recent].slice(0,20));
}
function home(){
 root.innerHTML='<section class="hero"><span class="eyebrow">The next three / 06–08</span><h1>Make it easy to say yes.</h1><p>Fill a spot, reserve a small batch, or get lost gear back. Each tool starts with one link.</p></section><div class="cards" id="cards"></div>';
 for(const [kind,p] of Object.entries(products)){
  const a=anchor('',productUrl(kind),'tile'), desc=el('div',undefined,'desc');
  desc.append(el('span',p.label,'eyebrow'),el('h2',p.name),el('p',p.desc));const arrow=el('span','↗','arrow');arrow.setAttribute('aria-hidden','true');a.append(art(kind),desc,arrow);$('#cards').append(a);
 }
 const recent=organizerList();
 if(recent.length){
  const shelf=el('section',undefined,'panel narrow'), list=el('ul',undefined,'entries');
  shelf.append(el('h2','My organizer links'),el('p','These private links are saved in this browser. Keep them to yourself.','hint'),list);
  for(const v of recent){const li=el('li');li.append(anchor(v.title,page(v.id,v.secret)));list.append(li);}root.append(shelf);
 }
}
function create(kind){
 const p=products[kind];
 const h=head(kind,p.name,p.desc), grid=el('div',undefined,'grid '+kind);
 if(browserDemo){
  const hButtons=el('div',undefined,'actions');hButtons.append(anchor('Try a sample page',page(sampleId(kind)),'button secondary'),anchor('See the sample dashboard',page(sampleId(kind),'example'),'button secondary'));h.firstElementChild.append(hButtons);
 }
 let columns='';
 if(kind!=='tag'){
  columns='<div class="pair">'+field('when',kind==='bench'?'Game time and time zone':'Pickup time and time zone','maxlength="85" required')+field('where',kind==='bench'?'Venue':'General pickup location','maxlength="100" required')+'</div>'+field('capacity',kind==='bench'?'Spots available':'Items available','type="number" min="1" max="'+d.caps[kind]+'" step="1" value="'+(kind==='bench'?1:24)+'" required');
  if(kind==='bench')columns+='<label class="toggle"><input type="checkbox" name="waitlist" checked> Offer a backup list when all spots are filled</label>';
  if(kind==='drop')columns+='<div class="pair">'+field('price','Price per item (optional)','inputmode="decimal" maxlength="8" placeholder="16.00"')+'<label>Currency<select name="currency">'+d.currencies.map(c=>'<option>'+c+'</option>').join('')+'</select></label></div>';
 }
 grid.innerHTML='<form class="panel" id="create"><h2>'+p.cta+'</h2>'+field('title',kind==='tag'?'Public item label':kind==='bench'?'Game or position':'Drop title','maxlength="80" required')+columns+notes(kind==='tag'?'Public finder instructions (optional)':kind==='bench'?'What players need to know (optional)':'Pickup, payment or product notes (optional)')+'<div class="actions"><button type="submit">'+p.cta+'</button>'+(browserDemo?'<button class="secondary" type="button" id="sample-fill">Fill with an example</button>':'')+'</div>'+status()+'</form><section class="panel result"><h2>What happens next</h2><p id="steps"></p><p class="hint">'+(browserDemo?'Use fictional names and emails for the demo. Changes stay in this browser.':'Put only public details on this page. Keep the organizer link private; it can manage this listing and see replies.')+'</p></section>';
 root.append(grid);
 $('#steps').textContent=kind==='bench'?'Share the public link with your usual subs. Players can claim a spot or join as a backup. If a spot is removed, the next backup moves up.':kind==='drop'?'Share the public link with buyers. Reservations reduce the stock count. Confirm pickup and payment yourself from the private dashboard.':'Print the QR tag and attach it to your gear. A finder can leave a report, and you can open their reply email from the private dashboard.';
 const form=$('#create'), names=['title','when','where','note','capacity','price','currency'];
 if(browserDemo)$('#sample-fill').onclick=()=>{for(const n of names){const input=form.elements.namedItem(n);if(input)input.value=p.demo[n]??'';}};
 form.onsubmit=async event=>{
  event.preventDefault();const submit=form.querySelector('[type=submit]');submit.disabled=true;$('#status').textContent='Creating…';
  try{const {board,secret}=await request('POST','',{kind,...pick(form,names),waitlist:form.elements.namedItem('waitlist')?.checked===true});remember(board,secret);location.assign(page(board.id,secret));}
  catch(e){$('#status').textContent=e.message;submit.disabled=false;}
 };
}
function boardArt(b){
 if(b.kind==='tag')return ['ITEM STATUS',b.recovered?'Recovered':b.closed?'Reports paused':'Finder reports open',b.recovered?'The item is back with its owner.':'Finder details stay private.'];
 const name=b.kind==='bench'?'GAME ROSTER':'PICKUP DROP', noun=b.kind==='bench'?' spot':' item';
 return [name,b.closed?'Closed':b.remaining===0?(b.kind==='bench'?'Roster full':'Sold out'):b.remaining+noun+(b.remaining===1?'':'s')+' left',b.when];
}
function details(b){
 const out=el('section',undefined,'panel result');
 out.append(el('h2',b.kind==='bench'?'Game details':b.kind==='drop'?'Pickup details':'Item details'));
 if(b.when)out.append(el('p',b.when));
 if(b.where)out.append(el('p',b.where));
 if(b.note)out.append(el('p',b.note,'note'));
 if(b.kind!=='tag'){
  const counter=el('p',undefined,'counter');counter.id='remaining';
  const n=el('b',String(b.remaining));counter.append(n,document.createTextNode(b.kind==='bench'?' spot'+(b.remaining===1?'':'s')+' open':' item'+(b.remaining===1?'':'s')+' left'));out.append(counter);
 }
 if(b.kind==='drop'&&Number.isInteger(b.unitCents))out.append(el('p',money(b.unitCents,b.currency)+' each','unit-price'));
 if(b.recovered)out.append(el('p','Recovered. The item is back with its owner.','counter'));
 else if(b.closed)out.append(el('p','This page is closed.','hint'));
 return out;
}
function receiptActions(container,b,key){
 const value=page(b.id,key,true), action=el('div',undefined,'actions'), info=el('p',undefined,'status');info.setAttribute('role','status');
 action.append(anchor('Open private status link',value,'button secondary'),btn('Copy private status link',async()=>{
  try{await navigator.clipboard.writeText(value);info.textContent='Private link copied.';}
  catch{info.textContent='Open the private status link and copy it from your address bar.';}
 }));
 container.append(action,info);
}
function receiptPage(b,r){
 const label=b.kind==='bench'?(r.state==='waiting'?'On the backup list':r.promoted?'You moved into the roster':'Your spot is confirmed'):'Your reservation is confirmed';
 head(b.kind,b.title,label,'Private status',boardArt(b));
 const panel=el('section',undefined,'panel narrow');
 panel.append(el('h2',label));
 if(b.kind==='bench'){
  panel.append(el('p',r.state==='waiting'?'Check this link again to see if a spot opened. The captain can contact you directly.':'The captain can contact you using the email you provided.'));
 }else{
  panel.append(el('p',r.quantity+' item'+(r.quantity===1?'':'s')+' reserved'+(Number.isInteger(r.totalCents)?' · '+money(r.totalCents,b.currency)+' total':'')),el('p','Nothing has been charged. Contact the seller about pickup or payment.'));
 }
 if(b.when)panel.append(el('p',b.when,'hint'));
 panel.append(btn('Refresh my status',()=>location.reload()),el('p',browserDemo?'This status link only works in this browser demo.':'Keep this status link to check your entry again. This service does not send automated messages.','hint'));
 root.append(panel);
}
function publicPage(b){
 const kind=b.kind,p=products[kind];
 head(kind,b.title,kind==='bench'?'Claim an opening or offer to be a backup.':kind==='drop'?'Reserve items for the pickup time.':'Leave a private note for the person who owns this item.',p.name,boardArt(b));
 const grid=el('div',undefined,'grid '+kind);
 grid.append(details(b));root.append(grid);
 const form=el('form',undefined,'panel');form.id='entry-form';grid.append(form);
 const backup=kind==='bench'&&b.remaining===0&&b.waitlistOpen;
 const action=kind==='bench'?(backup?'Join as backup':'Claim a spot'):kind==='drop'?'Reserve items':'Send found-item report';
 if(b.closed||(b.remaining===0&&!backup)){
  const heading=b.recovered?'This item is recovered':b.closed?'This page is closed':kind==='bench'?'All spots are filled':'This drop is sold out';
  form.append(el('h2',heading),btn('Refresh availability',()=>location.reload()));return;
 }
 form.innerHTML='<h2>'+action+'</h2>'+(backup?'<p class="hint">If a spot opens, the first backup moves up. Save your private status link after joining to check again.</p>':'')+field('name','Your name','maxlength="70" required autocomplete="name"')+field('email','Reply email','type="email" maxlength="160" required autocomplete="email"')+(kind==='drop'?field('quantity','How many?','type="number" min="1" max="'+b.remaining+'" value="1" required')+'<p id="order-total" class="counter" role="status" hidden></p>':'')+(kind==='tag'?notes('Where did you find it?','required'):notes('Note for the organizer (optional)'))+'<p class="hint">Only the organizer can see your name, email and notes. '+(kind==='drop'?'No payment is taken here.':'')+'</p><div class="actions"><button type="submit">'+action+'</button>'+(browserDemo?'<button class="secondary" type="button" id="demo-entry">Use fictional details</button>':'')+'</div>'+status();
 if(kind==='drop'&&Number.isInteger(b.unitCents)){
  const qty=form.elements.namedItem('quantity'), total=$('#order-total');
  const update=()=>{const count=Number(qty.value);total.hidden=!qty.validity.valid||!Number.isInteger(count)||count<1;total.textContent='Reservation total: '+money(b.unitCents*count,b.currency);};
  qty.oninput=update;update();
 }
 if(browserDemo)$('#demo-entry').onclick=()=>{form.elements.namedItem('name').value='Alex Example';form.elements.namedItem('email').value='alex'+newId().slice(0,5)+'@example.test';form.elements.namedItem('note').value=kind==='tag'?'I found it beside the arena’s front desk.':'';};
 form.onsubmit=async event=>{
  event.preventDefault();const submit=form.querySelector('[type=submit]');submit.disabled=true;$('#status').textContent='Submitting…';
  try{
   const {board,receiptKey,state}=await request('POST','/'+b.id+'/entries',{...pick(form,['name','email','quantity','note']),backup});
   const previous=$('.grid .result');previous.replaceWith(details(board));
   const before=$('.product .art');before.replaceWith(art(kind,boardArt(board)));
   const waiting=state==='waiting';
   const title=el('h2',kind==='bench'?(waiting?'You’re on the backup list':'Spot confirmed'):kind==='drop'?'Reservation confirmed':'Report sent to the owner’s dashboard');title.tabIndex=-1;
   form.replaceChildren(title,el('p',kind==='bench'?(waiting?'Save your private status link to see whether you get a spot.':'The captain can contact you using the email you provided.'):kind==='drop'?'The seller can contact you with pickup or payment details. Nothing has been charged.':'The owner can reply using the email you provided.'));
   if(receiptKey)receiptActions(form,b,receiptKey);
   form.append(anchor('Back to the public page',page(b.id),'button secondary'));title.focus();
  }catch(e){$('#status').textContent=e.message;submit.disabled=false;if(e.status===409&&!form.querySelector('[data-refresh]')){const refresh=btn('Refresh availability',()=>location.reload());refresh.dataset.refresh='true';form.append(refresh);}}
 };
}
function links(b,secret,stash){
 const card=el('section',undefined,'panel links'), head=el('h2','Your two links'), hint=el('p',browserDemo?'The demo uses browser storage. A new listing will not share its activity with another person or phone.':'Give the public link to players, buyers or finders. The organizer link is private and can see replies or manage the page.','hint');
 card.append(head,hint);
 const actionInfo=el('p',undefined,'status');actionInfo.setAttribute('role','status');
 for(const [label,value,share] of [['Public link',page(b.id),true],['Private organizer link',page(b.id,secret),false]]){
  const field=el('label',label), input=el('input');input.value=value;input.setAttribute('readonly','');field.append(input);card.append(field);
  const actions=el('div',undefined,'actions');
  actions.append(btn('Copy '+label.toLowerCase(),async()=>{try{await navigator.clipboard.writeText(value);actionInfo.textContent=label+' copied.';}catch{input.focus();input.select();actionInfo.textContent='Link selected. Use your device’s Copy command.';}}));
  if(share)actions.append(anchor('Open public page',value,'button secondary'));
  card.append(actions);
 }
 if(!stash)card.append(el('p','This browser could not remember the organizer link. Bookmark it or copy it somewhere safe.','hint'));
 card.append(actionInfo);return card;
}
function qrPanel(b){
 const card=el('section',undefined,'panel qr-tag');card.append(el('h2',b.title),el('p','If found, scan this code to send a private report.'));
 try{
  const qr=qrcode(0,'M');qr.addData(page(b.id));qr.make();
  const img=el('img',undefined,'qr');img.alt='QR code that opens the public finder form';img.src=qr.createDataURL(6,24);card.append(img);
  if(browserDemo)card.append(el('p','Demo tag. Use the shared version before printing labels for real items.','hint'));
  const actions=el('div',undefined,'actions');
  actions.append(btn('Download QR',()=>{const a=anchor('',img.src);a.download='claimtag-qr.gif';document.body.append(a);a.click();a.remove();}),btn('Print tag',()=>{document.body.classList.add('print-tag');addEventListener('afterprint',()=>document.body.classList.remove('print-tag'),{once:true});window.print();}));
  card.append(actions);
 }catch{card.append(el('p','Could not make a QR code. Use the public link.','hint'));}
 return card;
}
function organizer(b,secret){
 const kind=b.kind,p=products[kind];head(kind,b.title,'Manage this page and view replies. Keep this organizer link private.',p.name+' / Private organizer',boardArt(b));
 const grid=el('div',undefined,'grid '+kind+(kind==='tag'?' tag-print-grid':''));
 root.append(grid);
 const stash=browserDemo&&b.id.startsWith('sample-')?true:remember(b,secret);
 grid.append(links(b,secret,stash),details(b));
 if(kind==='tag')grid.append(qrPanel(b));
 const roster=el('section',undefined,'panel full'), label=kind==='bench'?'Roster and backups':kind==='drop'?'Reservations':'Private finder reports';
 roster.append(el('h2',label),el('p',kind==='tag'?'Refresh to check for reports. You can reply from your own email app. This version doesn’t send automatic notifications.':'Refresh for the latest list. Reply to participants directly using their contact details.','hint'));
 const feedback=el('p',undefined,'status');feedback.setAttribute('role','status');
 let pending=false;
 async function adjust(action,entryId){
  if(pending)return;
  pending=true;
  try{
   const {board}=await request('PATCH','/'+b.id,{action,entryId},secret);
   if(!board){persist(recentKey,organizerList().filter(x=>x.id!==b.id));location.assign(productUrl(b.kind));return;}
   organizer(board,secret);$('#owner-feedback').textContent=action==='remove'?'Entry removed.':action==='recover'?'Item marked recovered. Finder reports are closed.':action==='close'?'Public page closed.':'Public page reopened.';
  }catch(e){feedback.textContent=e.message;}finally{pending=false;}
 }
 if(kind==='drop'&&Number.isInteger(b.unitCents)){
  const units=b.entries.reduce((sum,x)=>sum+x.quantity,0);
  roster.append(el('p',units+' of '+b.capacity+' items reserved · '+money(units*b.unitCents,b.currency)+' in reservations','counter'),el('p','This is the value reserved, not money collected.','hint'));
 }
 if(kind==='bench'){
  const wait=b.entries.filter(r=>r.state==='waiting').length;
  roster.append(el('p',(b.entries.length-wait)+' confirmed · '+wait+' waiting','counter'));
 }
 const all=el('ul',undefined,'entries');all.id='entries';
 const ordered=kind==='bench'?[...b.entries].sort((x,y)=>Number(x.state==='waiting')-Number(y.state==='waiting')):b.entries;
 for(const e of ordered){
  const row=el('li'), name=el('strong',e.name+(kind==='drop'?' · '+e.quantity+' reserved'+(Number.isInteger(e.totalCents)?' · '+money(e.totalCents,b.currency):''):kind==='bench'?(e.state==='waiting'?' · Backup':e.promoted?' · Promoted from backup':' · Confirmed'):''));
  row.append(el('p'));row.firstElementChild.append(name);
  if(e.note)row.append(el('p',e.note,'note'));
  const actions=el('div',undefined,'actions');
  const mail='mailto:'+encodeURIComponent(e.email).replace('%40','@')+'?subject='+encodeURIComponent(p.name+' · '+b.title);
  actions.append(anchor('Reply to '+e.name,mail,'button secondary'),btn('Remove '+e.name,()=>{if(confirm('Remove this entry'+(kind==='tag'?'?':' and make its place available again?')))adjust('remove',e.id);}));
  row.append(el('p',e.email,'hint'),actions);all.append(row);
 }
 if(!b.entries.length)all.append(el('li',kind==='tag'?'No reports yet.':kind==='drop'?'No reservations yet.':'No one has claimed a spot yet.','hint'));
 roster.append(all);
 const actions=el('div',undefined,'actions');
 actions.append(btn('Refresh dashboard',async()=>{if(pending)return;pending=true;try{const result=await request('GET','/'+b.id,undefined,secret);organizer(result.board,secret);$('#owner-feedback').textContent='Dashboard refreshed.';}catch(e){feedback.textContent=e.message;}finally{pending=false;}}),btn(b.closed?'Reopen public page':'Close public page',()=>adjust(b.closed?'reopen':'close')));
 if(kind==='tag'&&!b.recovered)actions.append(btn('Mark item recovered',()=>adjust('recover')));
 actions.append(btn(browserDemo&&b.id.startsWith('sample-')?'Reset sample':'Delete page',()=>{if(confirm(browserDemo&&b.id.startsWith('sample-')?'Reset this sample and remove demo entries?':'Permanently delete this page and its replies?'))adjust('delete');}));
 feedback.id='owner-feedback';roster.append(actions,feedback);grid.append(roster);
}
async function main(){
 const u=new URL(location.href), id=u.searchParams.get('board'), kind=u.searchParams.get('product');
 const fragment=new URLSearchParams(u.hash.slice(1)), secret=fragment.get('manage'), receipt=fragment.get('receipt');
 browserDemo=/\.github\.io$/i.test(location.hostname)||forcedDemo;
 if(browserDemo){const banner=$('#mode');banner.hidden=false;banner.textContent='Browser demo · Use sample details. Activity stays on this browser. Public claims, reservations and reports require the shared version.';}
 if(id){
  if(!/^[\w-]{1,24}$/.test(id)){failure('This page could not be found.');return;}
  try{
   if(receipt){const result=await request('GET','/'+id+'/receipt',undefined,receipt);receiptPage(result.board,result.receipt);}
   else{const {board}=await request('GET','/'+id,undefined,secret);if(secret)organizer(board,secret);else publicPage(board);}
  }
  catch(e){failure(e.message);if(secret||receipt)root.append(anchor('Open public page',page(id),'button secondary'));}
 }else if(Object.hasOwn(products,kind))create(kind);else home();
}
function failure(reason){const panel=el('section',undefined,'panel narrow');panel.append(el('h1','Couldn’t open this page'),el('p',reason),anchor('Back to Launchpad',forcedDemo?'?demo=1':'./','button secondary'));root.replaceChildren(panel);}
window.addEventListener('hashchange',()=>{if(new URL(location.href).searchParams.has('board'))main().catch(()=>failure('Try reloading this page.'));});
main().catch(()=>failure('Try reloading this page.'));
