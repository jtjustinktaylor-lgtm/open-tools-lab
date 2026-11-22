'use strict';
const D=globalThis.PilotDomain, root=document.querySelector('#app');
const kinds={
 slot:{name:'LastSlot',n:'01',glyph:'✦',color:'slot',tag:'BOOKINGS',head:'Put cancellations back to work.',desc:'Publish an opening. The first customer who meets your requirements can claim it.',audience:'For grooming shops',create:'Post an opening'},
 borrow:{name:'BorrowBoard',n:'02',glyph:'↳',color:'borrow',tag:'LOANER GEAR',head:'Know where the gear went.',desc:'Label each item with a QR code. Members check gear out, and you track due dates and returns.',audience:'For clubs and gear rooms',create:'Start a gear board'},
 rain:{name:'RainPlan',n:'03',glyph:'↗',color:'rain',tag:'GAME DAY',head:'One link for the weather call.',desc:'Post a delay, new venue or cancellation. Everyone checks the same page for the latest call.',audience:'For rec leagues and coaches',create:'Create a game page'},
};
const shared=document.querySelector('meta[name=field-kit-mode]').content==='shared';
let current, organizer, receipt, selected, readSerial=0, labelCount=0;
const STORE='fieldkit-demo-v1', now=()=>new Date().toISOString();
const sampleFuture=(h)=>new Date(Date.now()+h*3600000).toISOString();
const random=(len)=>Array.from(crypto.getRandomValues(new Uint8Array(len)),v=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[v%64]).join('');
const id=()=>random(16), mkKey=()=>random(32);
const route=()=>new URLSearchParams(location.hash.slice(1));
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function add(parent,...nodes){parent.append(...nodes);return parent;}
function a(text,href,cls){const e=el('a',text,cls);e.href=href;return e;}
function btn(text,onClick,cls='button'){const e=el('button',text,cls);e.type='button';e.addEventListener('click',onClick);return e;}
const boardURL=(id,owner,item,rec)=>'#'+new URLSearchParams({board:id,...(owner?{manage:owner}:{}),...(item?{item}:{}),...(rec?{receipt:rec}:{})});
const link=(fragment)=>new URL(fragment,location.href).href;
const date=(str)=>new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(str));
const cad=(value)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(value/100)+' CAD';
function input(label,name,opts={}){
 const w=el('label',undefined,'input'), caption=el('span',label);caption.id='field-label-'+(++labelCount);w.append(caption);let e;
 if(opts.options){e=el('select');for(const [value,text] of opts.options){const op=el('option',text);op.value=value;e.append(op);}}
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
function demo(kind){
 const data=readStore();if(!kinds[kind])return;
 const keys={slot:'slot-demo',rain:'rain-demo',borrow:'borrow-demo'}, key=keys[kind], owner=mkKey();
 if(!data[key]){
  const details={
   slot:{title:'Bath & tidy for a small dog',when:sampleFuture(42),where:'Juniper Grooming, 42 King St.',rules:'Dogs under 25 lb. Proof of rabies vaccination required at check-in.',price:'55'},
   borrow:{title:'Parkside Rec gear room',days:'5'},
   rain:{title:'Parkside U13 vs. Hillcrest',when:sampleFuture(48),where:'West Diamond, Parkside',note:'Warmups start 30 minutes before first pitch.'}
  }[kind], t=now(), b=D.create({kind,...details},t,()=>key);
  if(kind==='borrow')for(const title of ['Batting helmet #04','Equipment bag #02','First aid kit #01'])D.edit(b,{action:'add',title},t,id);
  if(kind==='rain')D.edit(b,{action:'update',status:'moved',where:'East Diamond, Parkside',note:'The west field is too wet. Use the lot off King Street.'},t,id);
  data[key]={b,owner};writeStore(data);
 }
 return {id:key,owner:data[key].owner};
}
async function call(method,board,input,secret,rec,attempt){
 if(shared){
  const path=board?'api/boards/'+encodeURIComponent(board)+(attempt?'/act':''):'api/boards';
  const headers={};if(input)headers['Content-Type']='application/json';
  if(secret)headers.Authorization='Bearer '+secret;
  if(rec)headers['X-Receipt']=rec;
  const r=await fetch(new URL(path,location.href),{method,headers,body:input?JSON.stringify(input):undefined,cache:'no-store'});
  if(!r.headers.get('content-type')?.includes('application/json'))throw Error('The server did not respond. Try again.');
  const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error),{status:r.status});return data;
 }
 const data=readStore(), row=data[board], t=now();
 if(method==='POST'&&!board){const b=D.create(input,t,id),owner=mkKey();data[b.id]={b,owner};writeStore(data);return {board:D.view(b,t,true),secret:owner};}
 if(!row){throw Error('This board isn’t in this browser. Demo links open only where they were created.');}
 if(secret&&secret!==row.owner)D.fail('That private manager link does not match this board.',403);
 if(method==='GET')return {board:D.view(row.b,t,!!secret,rec)};
 if(method==='POST'){const receipt=D.act(row.b,input,t,id,mkKey);writeStore(data);return {board:D.view(row.b,t,false,receipt),receipt};}
 if(!secret)D.fail('Use your private manager link.',403);
 if(input.action==='delete'){delete data[board];writeStore(data);return {board:null};}
 D.edit(row.b,input,t,id);writeStore(data);return {board:D.view(row.b,t,true)};
}
function home(){
 const hero=el('section',undefined,'hero');
 const copy=add(el('div'),el('p','OPEN TOOLS STUDIO / THREE PILOTS','eyebrow'),el('h1','Keep the day moving.'),el('p','Fill one opening. Get the gear back. Tell everyone where to play.','intro'));
 const side=add(el('div',undefined,'hero-mark'),el('span','✳'),el('div','BOOK / BORROW / PLAY'));
 hero.append(copy,side);
 const cards=el('section',undefined,'cards');
 for(const [key,k] of Object.entries(kinds)){
  const c=el('article',undefined,'product '+k.color), top=add(el('div',undefined,'product-top'),el('span',k.n+' / '+k.tag),el('i',k.glyph));
  const actions=add(el('div',undefined,'actions'),a(k.create,'#new='+key,'button'));
  if(!shared)actions.append(a('Try sample','#demo='+key,'subtle'));
  cards.append(add(c,top,el('p',k.audience,'eyebrow'),el('h2',k.name),el('p',k.head,'card-head'),el('p',k.desc,'muted'),actions));
 }
 const expl=el('p',shared?'Publish a board, then share its public link. Keep the manager link for yourself.':'This preview saves changes in this browser. Use sample details to test the full flow.','demo-note');
 root.replaceChildren(hero,cards,expl);
}
function newBoard(k){
 const p=kinds[k];
 const f=[input(k==='borrow'?'Gear board name':k==='rain'?'Game or event name':'Service or opening','title',{maxlength:120})];
 if(k==='borrow')f.push(input('Default loan length (days)','days',{type:'number',min:1,max:30,value:5}));
 else f.push(input(k==='slot'?'Appointment time':'Scheduled start','when',{type:'datetime-local'}),input(k==='slot'?'Shop and address':'Original location','where',{maxlength:120}));
 if(k==='slot')f.push(input('Who can book?','rules',{maxlength:240,placeholder:'e.g. Small dogs with current vaccinations'}),input('Price (CAD)','price',{mode:'decimal',placeholder:'55.00'}));
 if(k==='rain')f.push(input('First update (optional)','note',{maxlength:240,required:false}));
 root.replaceChildren(heading(p,p.create,'Once published, you’ll get a public link and a private manager link.'),form('',f,async v=>{
  const r=await call('POST',null,{...v,kind:k});location.hash=boardURL(r.board.id,r.secret);
 },'Publish '+(k==='slot'?'opening':k==='rain'?'game page':'gear board')));
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
 const details=add(el('dl'),row('When',date(b.when)),row('Where',b.where),row('Price',cad(b.price)),row('Booking requirements',b.rules));
 page.append(panel('The opening',badge(status,b.state),details));
 if(b.owner){
  const actions=el('div',undefined,'actions');
  if(b.state==='available')actions.append(actionButton('Close opening','close',edit));
  if(b.state==='claimed')actions.append(actionButton('Release claim','release',edit,{},'Release this customer’s claim?'));
  if(b.state==='closed'&&b.when>now())actions.append(actionButton('Reopen opening','reopen',edit));
  if(b.claim)page.append(panel('Customer claim',add(el('dl'),row('Name',b.claim.name),row('Email',b.claim.email),row('Claimed',date(b.claim.at))),actions));
  else if(actions.children.length)page.append(panel('Manage opening',actions));
 }else if(b.receipt){
  page.append(panel('You claimed this spot',el('p','Your appointment is at '+date(b.when)+'. Payment is handled by the shop.'),copyControl('Copy private confirmation',link(boardURL(b.id,null,null,receipt)))));
 }else if(b.state==='available'){
  page.append(form('Claim this opening',[input('Your name','name',{autocomplete:'name',maxlength:80}),input('Your email','email',{type:'email',autocomplete:'email',maxlength:160}),check('I meet the booking requirements.')],claim,'Claim appointment'));
 }else page.append(panel('This opening is no longer available',el('p','Check with the shop for its next opening.')));
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
function viewBorrow(b,page,edit){
 const out=b.items.filter(i=>i.state==='out').length;
 if(b.owner){
  page.append(form('Add a loaner item',[input('Item label','title',{maxlength:120,placeholder:'e.g. Helmet #04'})],v=>edit({action:'add',...v}),'Add item'),
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
 if(!b.items.length)list.append(el('p','No gear has been added yet.'));
 for(const i of b.items){
  const v=add(el('article',undefined,'item'),add(el('div',undefined,'item-title'),el('h3',i.title),badge(i.state==='in'?'Available':i.due<now()?'Overdue':'On loan',i.state==='in'?'available':'closed')));
  if(i.due)v.append(el('p',(i.name?i.name+' · ':'')+'Due '+date(i.due),'muted'));
  const href=boardURL(b.id,null,i.id), publicLink=link(href);
  const row=add(el('div',undefined,'actions'),a(b.owner?'Open item page':'View item',href,'subtle'));
  if(b.owner)row.append(copyControl('Copy item link',publicLink),actionButton(i.state==='out'?'Mark returned':'Remove item',i.state==='out'?'return':'remove',edit,{item:i.id},i.state==='in'?'Remove this item?':undefined));
  v.append(row);if(b.owner)v.append(qrControl(publicLink,i.title));list.append(v);
 }
 page.append(list);
}
function viewRain(b,page,edit){
 const latest=b.updates[0];
 page.append(panel('Current game status',badge(D.stages[latest.status],latest.status),add(el('dl'),row(latest.status==='cancelled'?'Originally scheduled':'Start',date(latest.when||b.when)),row(latest.status==='cancelled'?'Original location':'Location',latest.where||b.where),...(latest.note?[row('Update',latest.note)]:[]),row('Posted',date(latest.at)))));
 if(b.owner){
  const status=input('Status','status',{options:Object.entries(D.stages),value:latest.status});
  const where=input('New location','where',{maxlength:120,value:latest.where||'',required:false}),when=input('New start time','when',{type:'datetime-local',required:false}), note=input('Message to players','note',{maxlength:240,required:false,placeholder:'e.g. Use the east entrance'});
  const sync=()=>{
   const value=status.querySelector('select').value;
   const w=where.querySelector('input'),t=when.querySelector('input'),n=note.querySelector('input');
   where.hidden=value!=='moved';w.disabled=where.hidden;w.required=!where.hidden;
   when.hidden=!['moved','delayed'].includes(value);t.disabled=when.hidden;t.required=value==='delayed';
   n.required=['moved','delayed'].includes(value);
  };
  status.addEventListener('change',sync);sync();
  page.append(form('Post a change',[status,where,when,note],v=>edit({action:'update',...v}),'Publish update'));
 }
 if(b.updates.length>1){
  const history=el('ol',undefined,'history');
  for(const u of b.updates.slice(1))history.append(add(el('li'),el('strong',D.stages[u.status]),el('span',date(u.at)),...(u.note?[el('p',u.note)]:[])));
  page.append(panel('Earlier updates',history));
 }
}
async function claim(values){
 const boardId=current.id, itemId=selected, start=location.hash;
 const r=await call('POST',boardId,values,null,null,true);
 if(location.hash===start)location.hash=boardURL(boardId,null,itemId,r.receipt);
}
function board(b){
 current=b;const p=kinds[b.kind], page=el('div',undefined,'boards');
 const edit=async values=>{
  const start=location.hash;
  const r=await call('PATCH',b.id,values,organizer);
  if(location.hash!==start)return;
  if(!r.board){location.hash='';return;}board(r.board);
 };
 const publicLink=link(boardURL(b.id));
 if(b.owner){
  page.append(panel('Share this board',el('p',shared?'Share the public link. Save the private manager link to make changes later.':'This is a browser preview. Other people cannot open your saved boards.'),add(el('div',undefined,'actions'),a('Open public page',publicLink,'subtle'),copyControl('Copy public link',publicLink),copyControl('Copy private manager link',location.href)),qrControl(publicLink,b.title)));
 }else{
  const identity=el('div',undefined,'public-bar');
  identity.append(el('span',b.kind==='rain'?'Check here for the latest game status.':'PUBLIC PAGE','eyebrow'),btn('Refresh',refresh,'button quiet'));
  if(!shared){const sample=readStore()[b.id];if(sample)identity.append(a('Manager view',boardURL(b.id,sample.owner),'subtle'));}
  page.append(identity);
 }
 if(b.kind==='slot')viewSlot(b,page,edit);
 if(b.kind==='borrow')viewBorrow(b,page,edit);
 if(b.kind==='rain')viewRain(b,page,edit);
 if(b.owner)page.append(panel('Board settings',actionButton('Delete board','delete',edit,{},'Delete this board and its entries?')));
 root.replaceChildren(heading(p,b.title,b.owner?'Manager view':'Public page'),page);
}
async function navigate(quiet=false,passive=false){
 const request=++readSerial, qp=route();
 organizer=qp.get('manage');receipt=qp.get('receipt');selected=qp.get('item');
 try{
  const key=qp.get('board');
  if(key){
   const {board:b}=await call('GET',key,null,organizer,receipt);
   if(request===readSerial&&(!passive||b.updated!==current?.updated)){board(b);if(!quiet)window.scrollTo(0,0);}
   return;
  }
  if(!shared&&Object.hasOwn(kinds,qp.get('demo'))){
   const d=demo(qp.get('demo'));location.replace(boardURL(d.id,d.owner));return;
  }
  if(Object.hasOwn(kinds,qp.get('new')))newBoard(qp.get('new'));else home();
  if(!quiet)window.scrollTo(0,0);
 }catch(e){if(request===readSerial&&(!passive||e.status===404))root.replaceChildren(panel('Page unavailable',el('p',e.message),a('Back to Field Kit','./','button')));}
}
(async()=>{
 document.querySelector('#mode').textContent=shared?'SHARED PILOT':'BROWSER PREVIEW';
 addEventListener('hashchange',()=>navigate());
 addEventListener('storage',e=>{if(!shared&&e.key===STORE&&current?.id&&route().has('board')&&!root.querySelector('form:focus-within'))navigate(true);});
 if(shared)setInterval(()=>{if(!document.hidden&&current?.kind==='rain'&&!current.owner&&route().get('board')===current.id)navigate(true,true);},15000);
 await navigate();
})();
