(function(root){
'use strict';
const fail=(s,status=400)=>{throw Object.assign(new Error(s),{status})};
const stages={on:'On as planned',moved:'Moved',delayed:'Delayed',cancelled:'Cancelled'};
function line(v,label,max=120,optional=false){
 const s=typeof v==='string'?v.trim():'';
 if((!s&&!optional)||s.length>max||/[\u0000-\u001f\u007f]/.test(s))fail('Enter '+label+' (up to '+max+' characters).');
 return s;
}
function future(v,t){const n=Date.parse(v);if(typeof v!=='string'||!Number.isFinite(n)||n<=Date.parse(t))fail('Choose a time in the future.');return new Date(n).toISOString();}
function sum(v){
 if(v===undefined||(typeof v==='string'&&!v.trim()))return null;
 if(typeof v!=='string'||!/^\d{1,5}(?:\.\d{1,2})?$/.test(v.trim()))fail('Enter a valid price in CAD.');
 const [d,c='']=v.trim().split('.');return Number(d)*100+Number(c.padEnd(2,'0'));
}
function duration(v){
 if(v===undefined||v==='')return null;
 if(!/^\d{1,3}$/.test(String(v))||+v<5||+v>720)fail('Enter a duration from 5 to 720 minutes.');
 return +v;
}
const hubs={'slot-hub':'slot','rain-hub':'rain'};
function create(p,t,id){
 if(Object.hasOwn(hubs,p.kind))return {id:id(),kind:p.kind,title:line(p.title,'a public name'),note:line(p.note,'a description',240,true),where:line(p.where,'a default location',120,true),created:t,updated:t,listings:[],contacts:[]};
 if(!['slot','borrow','rain'].includes(p.kind))fail('Choose a product.');
 const b={id:id(),kind:p.kind,title:line(p.title,'a name'),created:t,updated:t};
 if(b.kind==='slot')Object.assign(b,{when:future(p.when,t),where:line(p.where,'the business and location'),category:line(p.category,'a service type',48,true),with:line(p.with,'a team member or provider',80,true),duration:duration(p.duration),rules:line(p.rules,'booking requirements',240,true),price:sum(p.price),claim:null,closed:false});
 if(b.kind==='borrow')Object.assign(b,{days:loanDays(p.days),items:[]});
 if(b.kind==='rain')Object.assign(b,{when:future(p.when,t),where:line(p.where,'the original location'),updates:[{status:'on',at:t,note:line(p.note,'an update',240,true)}]});
 return b;
}
function loanDays(v){if(!/^\d{1,2}$/.test(String(v))||+v<1||+v>30)fail('Choose a loan period from 1 to 30 days.');return +v}
function contact(v){const s=line(v,'an email',160).toLowerCase();if(!/^[^\s@<>;,?&#%]+@[^\s@<>;,?&#%]+\.[^\s@<>;,?&#%]+$/.test(s))fail('Enter a valid email.');return s}
function item(b,id){const result=b.items.find(i=>i.id===id);if(!result)fail('That item was not found.',404);return result}
const slotState=(b,t)=>b.claim?'claimed':b.closed?'closed':b.when<=t?'expired':'available';
function act(b,p,t,id,receipt){
 if(b.kind==='rain')fail('Only the organizer can change the update.',405);
 if(p.agree!==true)fail(b.kind==='slot'?(b.rules?'Confirm you meet the booking requirements.':'Confirm you can make this appointment.'):'Confirm you have the item and agree to bring it back.');
 const name=line(p.name,'your name',80), token=receipt();
 if(b.kind==='slot'){
  if(slotState(b,t)!=='available')fail('This appointment is no longer available.',409);
  b.claim={name,email:contact(p.email),at:t,token};
 }else{
  const i=item(b,p.item);
  if(i.loan)fail('This item is already on loan.',409);
  const days=b.days,due=new Date(Date.parse(t)+days*86400000).toISOString();
  i.loan={name,at:t,due,token};
 }
 b.updated=t;return token;
}
function edit(b,p,t,id){
 switch(b.kind){
 case 'slot':
  if(p.action==='close'&&!b.claim&&!b.closed){b.closed=true;break;}
  if(p.action==='reopen'&&b.closed&&!b.claim&&b.when>t){b.closed=false;break;}
  if(p.action==='release'&&b.claim){b.claim=null;b.closed=false;break;}
  fail('That change is not available.',409);
  break;
 case 'borrow':
  if(p.action==='bulk-add'){
   if(!Array.isArray(p.titles)||!p.titles.length||p.titles.length>50||p.titles.length+b.items.length>100)fail('Add up to 50 at a time, with a maximum of 100 items on a board.');
   const titles=p.titles.map(v=>line(v,'an item name'));
   const used=new Set(b.items.map(i=>i.title.toLowerCase()));
   for(const title of titles){const k=title.toLowerCase();if(used.has(k))fail('The item name “'+title+'” is already in use.',409);used.add(k);}
   b.items.push(...titles.map(title=>({id:id(),title,loan:null})));break;
  }
  if(p.action==='add'){
   const title=line(p.title,'an item name');
   if(b.items.length>=100)fail('This board has reached 100 items.',409);
   if(b.items.some(i=>i.title.toLowerCase()===title.toLowerCase()))fail('That item name is already in use.',409);
   b.items.push({id:id(),title,loan:null});break;
  }
  if(p.action==='days'){b.days=loanDays(p.days);break;}
  if(p.action==='return'){
   const i=item(b,p.item);if(!i.loan)fail('That item is already available.',409);
   b.history??=[];b.history.unshift({id:id(),item:i.title,name:i.loan.name,borrowed:i.loan.at,due:i.loan.due,returned:t});
   if(b.history.length>250)b.history.length=250;
   i.loan=null;break;
  }
  if(p.action==='clear-history'){b.history=[];break;}
  if(p.action==='remove'){const i=item(b,p.item);if(i.loan)fail('Mark the item returned first.',409);b.items=b.items.filter(x=>x!==i);break;}
  fail('Choose an inventory action.');
  break;
 case 'rain': {
  if(p.action==='announce'){b.announcement={note:line(p.note,'an announcement',240),at:t};break;}
  if(p.action==='clear-announcement'){delete b.announcement;break;}
  if(p.action!=='update'||!Object.hasOwn(stages,p.status))fail('Choose a game status.');
  const note=line(p.note,'an update',240,!['delayed','moved'].includes(p.status));
  const where=p.status==='moved'?line(p.where,'the new location'):p.status==='delayed'?(b.updates[0].where||''):'';
  if(p.status==='delayed'&&!p.when)fail('Enter the new start time.');
  const when=['moved','delayed'].includes(p.status)&&p.when?future(p.when,t):p.status==='moved'?(b.updates[0].when||''):'';
  b.updates.unshift({status:p.status,at:t,note,...(where?{where}:{}),...(when?{when}:{})});b.updates.length=Math.min(10,b.updates.length);break;
 }
 }
 b.updated=t;
}
function view(b,t,owner=false,token){
 const {id,kind,title,updated}=b, v={id,kind,title,updated,owner};
 if(kind==='slot'){
  const {when,where,rules,price,category,with:provider,duration,claim}=b;
  return {...v,when,where,rules,price,category,with:provider,duration,state:slotState(b,t),...(owner&&claim?{claim:{name:claim.name,email:claim.email,at:claim.at}}:{}),...(token&&claim?.token===token?{receipt:{at:claim.at}}:{})};
 }
 if(kind==='borrow')return {...v,days:b.days,items:b.items.map(({id,title,loan})=>({id,title,state:loan?'out':'in',...(loan?{due:loan.due,...(owner?{name:loan.name,at:loan.at}:{}),...(token&&loan.token===token?{receipt:true}:{})}:{})})),...(owner?{history:b.history||[]}:{} )};
 return {...v,when:b.when,where:b.where,updates:b.updates,...(b.announcement?{announcement:b.announcement}:{})};
}
function findListing(b,listing){
 if(!Object.hasOwn(hubs,b.kind)||typeof listing!=='string')fail('This listing could not be found.',404);
 const child=b.listings.find(x=>x.id===listing);
 if(!child)fail('This listing could not be found.',404);
 return child;
}
function action(b,p,t,id,key){
 if(!Object.hasOwn(hubs,b.kind))return act(b,p,t,id,key);
 if(p.listing){
  const child=findListing(b,p.listing), token=act(child,p,t,id,key);
  b.updated=t;return token;
 }
 if(b.kind!=='slot-hub')fail('Only organizers can post updates here.',405);
 if(p.action==='unsubscribe'){
  const i=b.contacts.findIndex(c=>c.token===p.token);
  if(i<0)fail('That opt-out link is no longer active.',404);
  b.contacts.splice(i,1);b.updated=t;return null;
 }
 if(p.action!=='join'||p.agree!==true)fail('Choose whether to request appointment updates.');
 const email=contact(p.email), name=line(p.name,'your name',80), service=line(p.service,'a preferred service',80,true);
 if(b.contacts.some(c=>c.email===email))fail('That email is already on this list. Ask the business to update or remove it.',409);
 if(b.contacts.length>=500)fail('This waitlist is full.',409);
 const token=key();b.contacts.push({id:id(),name,email,service,token,joined:t});b.updated=t;return token;
}
function modify(b,p,t,id){
 if(!Object.hasOwn(hubs,b.kind)){edit(b,p,t,id);return;}
 switch(p.action){
  case 'new-listing': {
   if(b.listings.length>=80)fail('This workspace can hold up to 80 listings. Remove an old listing first.',409);
   b.listings.push(create({...p,kind:hubs[b.kind],where:(typeof p.where==='string'&&p.where.trim())||b.where},t,id));break;
  }
  case 'remove-contact':
   if(b.kind!=='slot-hub')fail('Choose a waitlist action.');
   b.contacts=b.contacts.filter(c=>c.id!==p.contact);break;
  case 'update-workspace':
   b.note=line(p.note,'a description',240,true);b.where=line(p.where,'a default location',120,true);break;
  default: {
   const child=findListing(b,p.listing);
   if(p.action==='delete-listing')b.listings=b.listings.filter(c=>c!==child);
   else edit(child,p,t,id);
  }
 }
 b.updated=t;
}
function present(b,t,owner=false,token,listing){
 if(!Object.hasOwn(hubs,b.kind)){if(listing)fail('This listing could not be found.',404);return view(b,t,owner,token);}
 if(listing){
  const child=findListing(b,listing);
  return {...view(child,t,owner,token),id:b.id,listing:child.id,workspace:b.title};
 }
 const effective=x=>x.updates?.[0]?.when||x.when;
 const sort=(x,y)=>{const a=effective(x),c=effective(y);return Number(a<t)-Number(c<t)||(a<t?c.localeCompare(a):a.localeCompare(c));};
 const listings=b.listings.filter(x=>owner||b.kind==='rain-hub'||slotState(x,t)==='available').map(x=>view(x,t)).sort(sort);
 return {id:b.id,kind:b.kind,title:b.title,note:b.note,where:b.where,updated:b.updated,owner,listings,
  ...(b.kind==='slot-hub'&&owner?{contacts:b.contacts.map(({token,...c})=>c)}:{}),
  ...(b.kind==='slot-hub'&&token&&b.contacts.some(c=>c.token===token)?{subscribed:true}:{})};
}
const api={create,act,edit,view,action,modify,present,stages,fail};
if(typeof module==='object')module.exports=api;else root.PilotDomain=api;
})(globalThis);
