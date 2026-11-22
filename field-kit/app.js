'use strict';
const D=globalThis.PilotDomain, root=document.querySelector('#app');
const kinds={
 slot:{name:'LastSlot',n:'01',glyph:'✦',color:'slot',tag:'APPOINTMENTS',head:'Turn a cancellation into a booking.',desc:'Hair, nails, barbers, pet grooming, or any appointment business. Post the opening and share one claim link.',audience:'For appointment businesses',create:'Post an opening',vision:'A shared waitlist, alerts for matching openings, and calendar sync across a team.'},
 borrow:{name:'BorrowBoard',n:'02',glyph:'↳',color:'borrow',tag:'ASSET LENDING',head:'Know who has what.',desc:'For clubs, schools, makerspaces, or teams with equipment. Give every loaner its own checkout QR.',audience:'For teams that lend equipment',create:'Start a gear board',vision:'Reservations, overdue reminders, and inventory across multiple locations.'},
 rain:{name:'RainPlan',n:'03',glyph:'↗',color:'rain',tag:'LIVE UPDATES',head:'One link when plans change.',desc:'Keep leagues, camps, classes, and organizers on the same page when the time, venue, or plan changes.',audience:'For groups that meet in person',create:'Create an event page',vision:'A schedule of events, opt-in alerts for changes, and a status page for each venue.'},
};
const slotSamples={
 hair:{title:'Cut & blow-dry',category:'Hair salon',where:'Studio Birch, 12 King St.',with:'Maya',duration:45,price:'65',blurb:'A 45-minute opening with Maya.'},
 nails:{title:'Gel manicure',category:'Nail salon',where:'Peony Nail Studio, 18 Main St.',with:'Sam',duration:50,price:'55',rules:'Please let the studio know if you need a removal.',blurb:'A nail appointment with a short booking note.'},
 barber:{title:'Haircut & beard trim',category:'Barber',where:'Parkside Barbers, 35 Market St.',duration:35,price:'42',blurb:'A same-day-style opening with an upfront price.'},
 grooming:{title:'Bath & tidy for a small dog',category:'Pet grooming',where:'Juniper Grooming, 42 King St.',duration:60,price:'55',rules:'Dogs under 25 lb. Proof of rabies vaccination required at check-in.',blurb:'A slot with specific requirements.'},
};
const shared=document.querySelector('meta[name=field-kit-mode]').content==='shared';
const invite=document.querySelector('meta[name=field-kit-access]').content==='invite';
const inviteField=()=>input('Pilot access code','accessCode',{type:'password',maxlength:180,autocomplete:'off'});
let current, organizer, receipt, selected, listing, readSerial=0, labelCount=0;
const STORE='fieldkit-demo-v1', now=()=>new Date().toISOString();
const sampleFuture=(h)=>new Date(Date.now()+h*3600000).toISOString();
const random=(len)=>Array.from(crypto.getRandomValues(new Uint8Array(len)),v=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[v%64]).join('');
const id=()=>random(16), mkKey=()=>random(32);
const route=()=>new URLSearchParams(location.hash.slice(1));
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function add(parent,...nodes){parent.append(...nodes);return parent;}
function a(text,href,cls){const e=el('a',text,cls);e.href=href;return e;}
function btn(text,onClick,cls='button'){const e=el('button',text,cls);e.type='button';e.addEventListener('click',onClick);return e;}
const boardURL=(id,owner,item,rec,listing)=>'#'+new URLSearchParams({board:id,...(owner?{manage:owner}:{}),...(item?{item}:{}),...(rec?{receipt:rec}:{}),...(listing?{listing}:{} )});
const link=(fragment)=>new URL(fragment,location.href).href;
const date=(str)=>new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(str));
const cad=(value)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(value/100)+' CAD';
function input(label,name,opts={}){
 const w=el('label',undefined,'input'), caption=el('span',label);caption.id='field-label-'+(++labelCount);w.append(caption);let e;
 if(opts.options){e=el('select');for(const [value,text] of opts.options){const op=el('option',text);op.value=value;e.append(op);}}
 else if(opts.multiline){e=el('textarea');e.rows=opts.multiline;}
 else {e=el('input');e.type=opts.type||'text';}
 e.name=name;e.setAttribute('aria-labelledby',caption.id);
 if(opts.placeholder)e.placeholder=opts.placeholder;if(opts.value!==undefined)e.value=opts.value;
 if(opts.min!==undefined)e.min=opts.min;if(opts.max!==undefined)e.max=opts.max;if(opts.maxlength)e.maxLength=opts.maxlength;
 if(opts.step)e.step=opts.step;if(opts.mode)e.inputMode=opts.mode;if(opts.autocomplete)e.autocomplete=opts.autocomplete;
 e.required=opts.required!==false;w.append(e);return w;
}
function check(text){const l=el('label',undefined,'check'),i=el('input');i.type='checkbox';i.name='agree';i.required=true;return add(l,i,el('span',text));}
function form(title,fields,action,label){
 const f=el('form',undefined,'panel form'), notice=el('p',undefined,'notice'), send=el('button',label,'button');
 notice.role='alert';send.type='submit';
 if(title)f.append(el('h2',title));
 f.addEventListener('submit',async e=>{
  e.preventDefault();send.disabled=true;notice.textContent='';
  const values=Object.fromEntries(new FormData(f));values.agree=values.agree==='on';
  if(values.when){const parsed=new Date(values.when);if(!Number.isFinite(+parsed)){notice.textContent='Enter a valid date and time.';send.disabled=false;return;}values.when=parsed.toISOString();}
  try{await action(values);}catch(err){notice.textContent=err.message||'Something went wrong.';}finally{send.disabled=false;}
 });
 return add(f,...fields,send,notice);
}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'{}');}catch{return {};}}
function writeStore(data){try{localStorage.setItem(STORE,JSON.stringify(data));}catch{throw Error('This browser cannot save the demo. Enable website storage and try again.');}}
function demo(kind, sample='grooming'){
 const data=readStore();if(!Object.hasOwn(kinds,kind))return;
 const key=kind==='slot'?'slot-'+sample+'-demo':kind+'-demo', owner=mkKey();
 if(!data[key]){
  const details={
   slot:{...slotSamples[sample],when:sampleFuture(sample==='barber'?5:42)},
   borrow:{title:'Parkside Rec gear room',days:'5'},
   rain:{title:'Parkside U13 vs. Hillcrest',when:sampleFuture(48),where:'West Diamond, Parkside',note:'Warmups start 30 minutes before first pitch.'}
  }[kind], t=now(), b=D.create({kind,...details},t,()=>key);
  if(kind==='borrow')for(const title of ['Batting helmet #04','Equipment bag #02','First aid kit #01'])D.edit(b,{action:'add',title},t,id);
  if(kind==='rain')D.edit(b,{action:'update',status:'moved',where:'East Diamond, Parkside',note:'The west field is too wet. Use the lot off King Street.'},t,id);
  data[key]={b,owner};writeStore(data);
 }
 return {id:key,owner:data[key].owner};
}
function sampleList(){
 const choices=el('div',undefined,'sample-grid');
 for(const [slug,sample] of Object.entries(slotSamples)){
  const card=add(el('article',undefined,'panel'),el('p',sample.category,'eyebrow'),el('h2',sample.title),el('p',sample.blurb),a('Try '+sample.category.toLowerCase(),'#demo=slot&sample='+slug,'button quiet'));
  choices.append(card);
 }
 root.replaceChildren(heading(kinds.slot,'Try an appointment','Choose a sample to test both the business and customer views.'),choices);
}
async function call(method,board,input,secret,rec,attempt,listing){
 if(shared){
  const path=board?'api/boards/'+encodeURIComponent(board)+(attempt?'/act':''):'api/boards';
  const headers={};if(input)headers['Content-Type']='application/json';
  if(secret)headers.Authorization='Bearer '+secret;
  if(rec)headers['X-Receipt']=rec;
  const endpoint=new URL(path,location.href);if(listing)endpoint.searchParams.set('listing',listing);
  const r=await fetch(endpoint,{method,headers,body:input?JSON.stringify(input):undefined,cache:'no-store'});
  if(!r.headers.get('content-type')?.includes('application/json'))throw Error('The server did not respond. Try again.');
  const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error),{status:r.status});return data;
 }
 const data=readStore(), row=data[board], t=now();
 if(method==='POST'&&!board){const b=D.create(input,t,id),owner=mkKey();data[b.id]={b,owner};writeStore(data);return {board:D.present(b,t,true),secret:owner};}
 if(!row){throw Error('This board isn’t in this browser. Demo links open only where they were created.');}
 if(secret&&secret!==row.owner)D.fail('That private manager link does not match this board.',403);
 if(method==='GET')return {board:D.present(row.b,t,!!secret,rec,listing)};
 if(method==='POST'){const receipt=D.action(row.b,input,t,id,mkKey);writeStore(data);return {board:D.present(row.b,t,false,receipt,input.listing),receipt};}
 if(!secret)D.fail('Use your private manager link.',403);
 if(input.action==='delete'&&!input.listing){delete data[board];writeStore(data);return {board:null};}
 D.modify(row.b,input,t,id);writeStore(data);return {board:D.present(row.b,t,true,undefined,input.action==='delete-listing'?undefined:input.listing)};
}
function home(){
 const hero=el('section',undefined,'hero');
 const copy=add(el('div'),el('p','OPEN TOOLS STUDIO / THREE PILOTS','eyebrow'),el('h1','Keep the day moving.'),el('p','Fill a cancelled appointment. Get the gear back. Keep everyone up to date.','intro'));
 const side=add(el('div',undefined,'hero-mark'),el('span','✳'),el('div','BOOK / BORROW / UPDATE'));
 hero.append(copy,side);
 const cards=el('section',undefined,'cards');
 for(const [key,k] of Object.entries(kinds)){
  const c=el('article',undefined,'product '+k.color), top=add(el('div',undefined,'product-top'),el('span',k.n+' / '+k.tag),el('i',k.glyph));
  const actions=add(el('div',undefined,'actions'),a(key==='slot'?'Start a booking page':key==='rain'?'Start a program page':k.create,key==='borrow'?'#new=borrow':'#workspace='+key,'button'));
  if(!shared)actions.append(a('Try sample',key==='slot'?'#samples=slot':'#demo='+key,'subtle'));
  const art=el('img',undefined,'product-art');art.src=key+'.svg';art.alt='';art.width=480;art.height=256;
  const next=add(el('details',undefined,'vision'),el('summary','Where it could go'),el('p',k.vision));
  cards.append(add(c,top,art,el('p',k.audience,'eyebrow'),el('h2',k.name),el('p',k.head,'card-head'),el('p',k.desc,'muted'),actions,next));
 }
 const expl=el('p',shared?'Publish a board, then share its public link. Keep the manager link for yourself.':'This preview saves changes in this browser. Use sample details to test the full flow.','demo-note');
 root.replaceChildren(hero,cards,expl);
}
function boardFields(k,where=''){
 const f=[input(k==='borrow'?'Gear board name':k==='rain'?'Event name':'Service or opening','title',{maxlength:120,...(k==='slot'?{placeholder:'e.g. Gel manicure'}:{})})];
 if(k==='borrow')f.push(input('Default loan length (days)','days',{type:'number',min:1,max:30,value:5}));
 else f.push(input(k==='slot'?'Appointment time':'Scheduled start','when',{type:'datetime-local'}),input(k==='slot'?'Business and location':'Original location','where',{maxlength:120,value:where}));
 if(k==='slot')f.push(input('Service type (optional)','category',{maxlength:48,placeholder:'e.g. Hair salon, nails, barber',required:false}),input('Provider name (optional)','with',{maxlength:80,placeholder:'e.g. Maya',required:false}),input('Duration in minutes (optional)','duration',{type:'number',min:5,max:720,placeholder:'45',required:false}),input('Booking requirements (optional)','rules',{maxlength:240,placeholder:'e.g. Existing clients only',required:false}),input('Price in CAD (optional)','price',{mode:'decimal',placeholder:'55.00',required:false}));
 if(k==='rain')f.push(input('First update (optional)','note',{maxlength:240,required:false}));
 return f;
}
function newBoard(k){
 const p=kinds[k], f=boardFields(k);if(invite)f.push(inviteField());
 root.replaceChildren(heading(p,p.create,'Once published, you’ll get a public link and a private manager link.'),form('',f,async v=>{
  const r=await call('POST',null,{...v,kind:k});location.hash=boardURL(r.board.id,r.secret);
 },'Publish '+(k==='slot'?'opening':k==='rain'?'event page':'gear board')));
}
function newWorkspace(k){
 const slot=k==='slot';
 root.replaceChildren(heading(kinds[k],slot?'Start a booking page':'Start a program page',slot?'Give your business one link for openings and the waitlist.':'Give your group one link for events and plan changes.'),form('',[
  input(slot?'Business name':'Program or group name','title',{maxlength:120}),
  input('Short description (optional)','note',{maxlength:240,required:false}),
  input('Default location (optional)','where',{maxlength:120,required:false,placeholder:'Business name and address, or venue'}),
  ...(invite?[inviteField()]:[])
 ],async v=>{const r=await call('POST',null,{kind:k+'-hub',...v});location.hash=boardURL(r.board.id,r.secret);},'Publish '+(slot?'booking page':'program page')));
}
function workspace(b){
 const slot=b.kind==='slot-hub', page=el('div',undefined,'boards'), secret=organizer;
 const mutate=async values=>{
  const start=location.hash, r=await call('PATCH',b.id,values,secret);
  if(start!==location.hash)return;
  if(!r.board){location.hash='';return;}board(r.board);
 };
 const pub=link(boardURL(b.id));
 if(b.owner){
  page.append(panel('Share this page',el('p',shared?'Use the same public link every time. Keep the private manager link somewhere safe.':'Preview only. This link opens where you created it, in this browser.'),add(el('div',undefined,'actions'),a('Open public page',pub,'subtle'),copyControl('Copy public link',pub),copyControl('Copy private manager link',location.href)),qrControl(pub,b.title)));
  const draft=el('details',undefined,'panel compose');draft.append(el('summary',slot?'Post an opening':'Add an event'),form('',boardFields(slot?'slot':'rain',b.where),v=>mutate({action:'new-listing',...v}),slot?'Publish opening':'Publish event'));
  page.append(draft);
 }else{
  const bar=add(el('div',undefined,'public-bar'),el('span',slot?'BOOKING PAGE':'PROGRAM PAGE','eyebrow'),btn('Refresh',refresh,'button quiet'));
  if(!shared){const row=readStore()[b.id];if(row)bar.append(a('Manager view',boardURL(b.id,row.owner),'subtle'));}
  page.append(bar);
 }
 const list=panel(slot?'Openings':'Events');
 if(!b.listings.length)list.append(el('p',slot?'No openings are available right now.':'No events have been posted yet.'));
 for(const entry of b.listings){
  const latest=entry.updates?.[0];
  const tag=slot?{available:'Available',claimed:'Claimed',closed:'Closed',expired:'Expired'}[entry.state]:D.stages[latest.status];
  const href=boardURL(b.id,secret,null,null,entry.id);
  const isOver=(latest?.when||entry.when)<=now();
  const row=add(el('article',undefined,'item'),add(el('div',undefined,'item-title'),a(entry.title,href,'item-link'),badge(tag,slot?entry.state:latest.status)),
   el('p',date(latest?.when||entry.when)+' · '+(latest?.where||entry.where),'muted'));
  if(slot&&(entry.category||Number.isInteger(entry.price)))row.append(el('p',[entry.category,Number.isInteger(entry.price)?cad(entry.price):null].filter(Boolean).join(' · ')));
  if(!slot&&entry.announcement)row.append(el('p',entry.announcement.note));
  if(!slot&&isOver)row.append(el('p','Past event','small'));
  row.append(a(b.owner?'Manage '+(slot?'opening':'event'):slot?'View opening':'See event status',href,'subtle'));list.append(row);
 }
 page.append(list);
 if(slot&&b.owner)page.append(waitlistManager(b,mutate));
 if(slot&&!b.owner){
  if(b.subscribed)page.append(panel('You’re on the waitlist',el('p','Save this private link if you want to opt out later. The business may contact you about matching openings.'),copyControl('Copy private opt-out link',location.href),
   btn('Leave waitlist',async e=>{const control=e.currentTarget;control.disabled=true;try{await call('POST',b.id,{action:'unsubscribe',token:receipt},null,null,true);location.hash=boardURL(b.id);}catch(err){const alert=el('p',err.message,'notice');alert.role='alert';control.after(alert);}finally{control.disabled=false;}},'button quiet')));
  else if(receipt)page.append(panel('This waitlist link is inactive',a('Back to the booking page',boardURL(b.id),'subtle')));
  else page.append(form('Join the waitlist',[input('Your name','name',{autocomplete:'name',maxlength:80}),input('Your email','email',{type:'email',autocomplete:'email',maxlength:160}),input('Preferred service (optional)','service',{maxlength:80,placeholder:'e.g. Gel manicure',required:false}),check('I agree to be contacted by '+b.title+' about matching openings.')],async v=>{
   const r=await call('POST',b.id,{action:'join',...v},null,null,true);location.hash=boardURL(b.id,null,null,r.receipt);
  },'Join waitlist'));
 }
 if(b.owner){
  const settings=el('details',undefined,'panel compose');settings.append(el('summary','Page settings'),form('',[input('Short description (optional)','note',{maxlength:240,required:false,value:b.note}),input('Default location (optional)','where',{maxlength:120,required:false,value:b.where})],v=>mutate({action:'update-workspace',...v}),'Save settings'),actionButton('Delete workspace','delete',mutate,{},'Delete this workspace, its listings, and any waitlist contacts?'));page.append(settings);
 }
 root.replaceChildren(heading(kinds[slot?'slot':'rain'],b.title,b.note|| (b.owner?'Manager workspace':'')),page);
}
function waitlistManager(b,edit){
 const box=panel('Waitlist',el('p',b.contacts.length+' opted in. You choose who to contact. Field Kit does not send messages.'));
 for(const c of b.contacts){
  const service=c.service.toLowerCase();
  const match=b.listings.find(e=>e.state==='available'&&(!service||(e.title+' '+(e.category||'')).toLowerCase().includes(service)));
  const item=add(el('article',undefined,'item'),el('h3',c.name),el('p',c.email),el('p',c.service?'Prefers: '+c.service:'Open to any service','muted'));
  if(match){
   const subject='Opening: '+match.title;
   const body='Hi '+c.name+', there is an opening at '+b.title+'. You can view or claim it here: '+link(boardURL(b.id,null,null,null,match.id))+'\n\nIf you no longer want booking updates, reply and ask us to remove you.';
   item.append(a('Draft email about '+match.title,'mailto:'+c.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body),'subtle'));
  }
  item.append(actionButton('Remove contact','remove-contact',edit,{contact:c.id},'Remove this contact from the waitlist?'));box.append(item);
 }
 return box;
}
function heading(p,title,description){
 return add(el('section',undefined,'board-top '+p.color),a('‹ All tools','./','back'),el('p',p.name.toUpperCase()+' / '+p.tag,'eyebrow'),el('h1',title),...(description?[el('p',description,'intro')]:[]));
}
function row(k,v){return add(el('div',undefined,'fact'),el('dt',k),el('dd',v));}
function badge(text,kind=''){return el('span',text,'badge '+kind);}
function panel(title,...elements){return add(el('section',undefined,'panel'),...(title?[el('h2',title)]:[]),...elements);}
function refresh(){return navigate(true)}
function viewSlot(b,page,edit){
 const status={available:'Open to book',claimed:'Claimed',closed:'Closed',expired:'Expired'}[b.state];
 const details=add(el('dl'),row('When',date(b.when)),row('Where',b.where),...(b.category?[row('Service type',b.category)]:[]),...(b.with?[row('With',b.with)]:[]),...(b.duration?[row('Duration',b.duration+' minutes')]:[]),row('Price',Number.isInteger(b.price)?cad(b.price):'Ask the business'),...(b.rules?[row('Booking requirements',b.rules)]:[]));
 page.append(panel('The opening',badge(status,b.state),details));
 if(b.owner){
  const actions=el('div',undefined,'actions');
  if(b.state==='available')actions.append(actionButton('Close opening','close',edit));
  if(b.state==='claimed')actions.append(actionButton('Release claim','release',edit,{},'Release this customer’s claim?'));
  if(b.state==='closed'&&b.when>now())actions.append(actionButton('Reopen opening','reopen',edit));
  if(b.claim)page.append(panel('Customer claim',add(el('dl'),row('Name',b.claim.name),row('Email',b.claim.email),row('Claimed',date(b.claim.at))),actions));
  else if(actions.children.length)page.append(panel('Manage opening',actions));
 }else if(b.receipt){
  page.append(panel('You claimed this spot',el('p','Your appointment is at '+date(b.when)+'. Payment is handled by the business.'),copyControl('Copy private confirmation',link(boardURL(b.id,null,null,receipt,b.listing)))));
 }else if(b.state==='available'){
  page.append(form('Claim this opening',[el('p','The business receives your name and email to manage the booking. They don’t appear on the public page.','muted'),input('Your name','name',{autocomplete:'name',maxlength:80}),input('Your email','email',{type:'email',autocomplete:'email',maxlength:160}),check(b.rules?'I meet the booking requirements.':'I can make this appointment.')],claim,'Claim appointment'));
 }else page.append(panel('This opening is no longer available',el('p','Check with the business for its next opening.')));
}
function actionButton(label,action,edit,extras={},confirmText){
 const error=el('span',undefined,'notice');error.role='alert';
 const control=btn(label,async()=>{
  if(confirmText&&!window.confirm(confirmText))return;
  control.disabled=true;error.textContent='';
  try{await edit({action,...extras});}catch(e){error.textContent=e.message;}finally{control.disabled=false;}
 },'button quiet');
 return add(el('span',undefined,'inline-control'),control,error);
}
function copyControl(label,value){
 const status=el('span',undefined,'small');status.role='status';
 const holder=el('div',undefined,'inline-control');
 const b=btn(label,async()=>{
  try{await navigator.clipboard.writeText(value);status.textContent='Copied.';}
  catch{if(!holder.querySelector('input')){
   const f=el('input',undefined,'copy-fallback');f.value=value;f.setAttribute('aria-label',label);f.readOnly=true;holder.append(f);f.select();
  }status.textContent='Select the link and copy it.';}
 },'button quiet');
 return add(holder,b,status);
}
function qrControl(href,title){
 const d=el('details',undefined,'qr');d.append(el('summary','Show QR label'));
 let rendered=false;
 d.addEventListener('toggle',()=>{
  if(!d.open||rendered)return;rendered=true;
  try{
   const q=qrcode(0,'M');q.addData(href);q.make();const img=el('img');img.alt='QR code for '+title;img.src=q.createDataURL(5,20);d.append(img,a('Download QR',img.src,'subtle'));
   d.lastChild.download='field-kit-qr.gif';
  }catch{d.append(el('p','The QR code could not be generated. Use the share link instead.'));}
 });
 return d;
}
function downloadHistory(history){
 const csvCell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const rows=[['Item','Borrower','Checked out (UTC)','Due (UTC)','Returned (UTC)'],...history.map(h=>[h.item,h.name,h.borrowed,h.due,h.returned])];
 const url=URL.createObjectURL(new Blob([rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const download=a('',''+url);download.download='borrowboard-returns.csv';download.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function viewBorrow(b,page,edit){
 const out=b.items.filter(i=>i.state==='out').length;
 if(b.owner){
  page.append(form('Add a loaner item',[input('Item label','title',{maxlength:120,placeholder:'e.g. Helmet #04'})],v=>edit({action:'add',...v}),'Add item'),
   form('Add a batch',[input('One item per line','titles',{multiline:4,placeholder:'Helmet #05'})],v=>edit({action:'bulk-add',titles:v.titles.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}),'Add items'),
   form('Default loan period',[input('Days for new loans','days',{type:'number',min:1,max:30,value:b.days})],v=>edit({action:'days',...v}),'Save loan period'));
 }
 if(!b.owner&&selected){
  const i=b.items.find(x=>x.id===selected);
  if(!i){page.append(panel('Item unavailable',a('View gear list',boardURL(b.id),'button quiet')));return;}
  page.append(panel(i.title,badge(i.state==='in'?'Available':'On loan',i.state==='in'?'available':'closed'),...(i.due?[el('p','Due '+date(i.due))]:[]),a('See all gear',boardURL(b.id),'subtle')));
  if(i.receipt)page.append(panel('Checked out to you',el('p','Bring it back by '+date(i.due)+'. The gear manager will mark it returned.'),copyControl('Copy private receipt',link(boardURL(b.id,null,i.id,receipt)))));
  if(i.state==='in')page.append(form('Check out this item',[input('Your name','name',{autocomplete:'name',maxlength:80}),check('I have this item and will bring it back in '+b.days+' days.')],v=>claim({...v,item:i.id}),'Check out'));
  return;
 }
 const list=panel('Gear list',el('p',b.items.length+' items · '+out+' on loan','muted'));
 const search=input('Find an item','inventory-query',{type:'search',required:false,placeholder:'Search gear by name'});
 const filter=input('Availability','inventory-status',{options:[['all','All items'],['in','Available'],['out','On loan'],['overdue','Overdue']],required:false});
 const count=el('p',undefined,'small');count.role='status';
 const entries=[];
 if(!b.items.length)list.append(el('p','No gear has been added yet.'));
 if(b.items.length)list.append(add(el('div',undefined,'inventory-control'),search,filter),count);
 function refine(){
  const q=search.querySelector('input').value.trim().toLowerCase(), f=filter.querySelector('select').value;
  let matches=0;
  for(const [i,v] of entries){
   const state=i.due&&i.due<now()?'overdue':i.state;
   const pass=i.title.toLowerCase().includes(q)&&(f==='all'||f===i.state||f===state);
   v.hidden=!pass;if(pass)matches++;
  }
  count.textContent=matches+' of '+entries.length+' items';
 }
 search.addEventListener('input',refine);filter.addEventListener('change',refine);

 for(const i of b.items){
  const v=add(el('article',undefined,'item'),add(el('div',undefined,'item-title'),el('h3',i.title),badge(i.state==='in'?'Available':i.due<now()?'Overdue':'On loan',i.state==='in'?'available':'closed')));
  if(i.due)v.append(el('p',(i.name?i.name+' · ':'')+'Due '+date(i.due),'muted'));
  const href=boardURL(b.id,null,i.id), publicLink=link(href);
  const row=add(el('div',undefined,'actions'),a(b.owner?'Open item page':'View item',href,'subtle'));
  if(b.owner)row.append(copyControl('Copy item link',publicLink),actionButton(i.state==='out'?'Mark returned':'Remove item',i.state==='out'?'return':'remove',edit,{item:i.id},i.state==='in'?'Remove this item?':undefined));
  v.append(row);if(b.owner)v.append(qrControl(publicLink,i.title));list.append(v);entries.push([i,v]);
 }
 if(entries.length)refine();
 page.append(list);
 if(b.owner&&b.history?.length){
  const history=el('details',undefined,'panel compose');history.append(el('summary','Return history · '+b.history.length),add(el('div',undefined,'actions'),btn('Download returns CSV',()=>downloadHistory(b.history),'button quiet'),actionButton('Clear return history','clear-history',edit,{},'Clear the saved return history?')));
  for(const h of b.history)history.append(add(el('article',undefined,'item'),el('h3',h.item),el('p',h.name+' · Returned '+date(h.returned),'muted')));
  page.append(history);
 }
}
function viewRain(b,page,edit){
 const latest=b.updates[0];
 if(b.announcement)page.append(panel('Pinned announcement',el('p',b.announcement.note),el('p','Posted '+date(b.announcement.at),'muted'),...(b.owner?[actionButton('Remove announcement','clear-announcement',edit)]:[])));
 page.append(panel('Current event status',badge(D.stages[latest.status],latest.status),add(el('dl'),row(latest.status==='cancelled'?'Originally scheduled':'Start',date(latest.when||b.when)),row(latest.status==='cancelled'?'Original location':'Location',latest.where||b.where),...(latest.note?[row('Update',latest.note)]:[]),row('Posted',date(latest.at)))));
 if(b.owner){
  const status=input('Status','status',{options:Object.entries(D.stages),value:latest.status});
  const where=input('New location','where',{maxlength:120,value:latest.where||'',required:false}),when=input('New start time','when',{type:'datetime-local',required:false}), note=input('Message to attendees','note',{maxlength:240,required:false,placeholder:'e.g. Use the east entrance'});
  const sync=()=>{
   const value=status.querySelector('select').value;
   const w=where.querySelector('input'),t=when.querySelector('input'),n=note.querySelector('input');
   where.hidden=value!=='moved';w.disabled=where.hidden;w.required=!where.hidden;
   when.hidden=!['moved','delayed'].includes(value);t.disabled=when.hidden;t.required=value==='delayed';
   n.required=['moved','delayed'].includes(value);
  };
  status.addEventListener('change',sync);sync();
  page.append(form('Post a change',[status,where,when,note],v=>edit({action:'update',...v}),'Publish update'));
  page.append(form('Pin an announcement',[input('Announcement','note',{maxlength:240,placeholder:'e.g. Bring indoor shoes',value:b.announcement?.note||''})],v=>edit({action:'announce',...v}),'Pin message'));
 }
 if(b.updates.length>1){
  const history=el('ol',undefined,'history');
  for(const u of b.updates.slice(1))history.append(add(el('li'),el('strong',D.stages[u.status]),el('span',date(u.at)),...(u.note?[el('p',u.note)]:[])));
  page.append(panel('Earlier updates',history));
 }
}
async function claim(values){
 const boardId=current.id, itemId=selected, listingId=current.listing, start=location.hash;
 const r=await call('POST',boardId,{...values,...(listingId?{listing:listingId}:{})},null,null,true);
 if(location.hash===start)location.hash=boardURL(boardId,null,itemId,r.receipt,listingId);
}
function board(b){
 current=b;if(b.kind.endsWith('-hub')){workspace(b);return;}
 const p=kinds[b.kind], page=el('div',undefined,'boards');
 const edit=async values=>{
  const start=location.hash;
  const r=await call('PATCH',b.id,{...values,...(b.listing?{listing:b.listing}:{})},organizer);
  if(location.hash!==start)return;
  if(!r.board){location.hash='';return;}
  if(values.action==='delete-listing'){location.hash=boardURL(b.id,organizer);return;}board(r.board);
 };
 const publicLink=link(boardURL(b.id,null,null,null,b.listing));
 if(b.listing)page.append(add(el('div',undefined,'public-bar'),a('‹ '+b.workspace,boardURL(b.id,organizer),'back')));
 if(b.owner){
  page.append(panel('Share this board',el('p',shared?'Share the public link. Save the private manager link to make changes later.':'This is a browser preview. Other people cannot open your saved boards.'),add(el('div',undefined,'actions'),a('Open public page',publicLink,'subtle'),copyControl('Copy public link',publicLink),copyControl('Copy private manager link',location.href)),qrControl(publicLink,b.title)));
 }else{
  const identity=el('div',undefined,'public-bar');
  identity.append(el('span',b.kind==='rain'?'Check here for the latest event status.':'PUBLIC PAGE','eyebrow'),btn('Refresh',refresh,'button quiet'));
  if(!shared){const sample=readStore()[b.id];if(sample)identity.append(a('Manager view',boardURL(b.id,sample.owner,null,null,b.listing),'subtle'));}
  page.append(identity);
 }
 if(b.kind==='slot')viewSlot(b,page,edit);
 if(b.kind==='borrow')viewBorrow(b,page,edit);
 if(b.kind==='rain')viewRain(b,page,edit);
 if(b.owner)page.append(panel('Board settings',b.listing?actionButton('Delete listing','delete-listing',edit,{},'Delete this listing and its entries?'):actionButton('Delete board','delete',edit,{},'Delete this board and its entries?')));
 root.replaceChildren(heading(p,b.title,b.owner?'Manager view':'Public page'),page);
}
async function navigate(quiet=false,passive=false){
 const request=++readSerial, qp=route();
 if(!passive){root.inert=true;root.setAttribute('aria-busy','true');}
 organizer=qp.get('manage');receipt=qp.get('receipt');selected=qp.get('item');listing=qp.get('listing');
 try{
  const key=qp.get('board');
  if(key){
   const {board:b}=await call('GET',key,null,organizer,receipt,false,listing);
   if(request===readSerial&&(!passive||b.updated!==current?.updated)){board(b);if(!quiet)window.scrollTo(0,0);}
   return;
  }
  if(!shared&&qp.get('samples')==='slot'){sampleList();if(!quiet)window.scrollTo(0,0);return;}
  if(!shared&&Object.hasOwn(kinds,qp.get('demo'))){
   const sample=Object.hasOwn(slotSamples,qp.get('sample'))?qp.get('sample'):'grooming';
   const d=demo(qp.get('demo'),sample);location.replace(boardURL(d.id,d.owner));return;
  }
  if(['slot','rain'].includes(qp.get('workspace'))){newWorkspace(qp.get('workspace'));if(!quiet)window.scrollTo(0,0);return;}
  if(Object.hasOwn(kinds,qp.get('new')))newBoard(qp.get('new'));else home();
  if(!quiet)window.scrollTo(0,0);
 }catch(e){if(request===readSerial&&(!passive||e.status===404))root.replaceChildren(panel('Page unavailable',el('p',e.message),a('Back to Field Kit','./','button')));}
 finally{if(request===readSerial){root.inert=false;root.removeAttribute('aria-busy');}}
}
(async()=>{
 document.querySelector('#mode').textContent=shared?'SHARED PILOT':'BROWSER PREVIEW';
 addEventListener('hashchange',()=>navigate());
 addEventListener('storage',e=>{if(!shared&&e.key===STORE&&current?.id&&route().has('board')&&!root.querySelector('form:focus-within'))navigate(true);});
 if(shared)setInterval(()=>{if(!document.hidden&&['rain','rain-hub'].includes(current?.kind)&&!current.owner&&route().get('board')===current.id)navigate(true,true);},15000);
 await navigate();
})();
