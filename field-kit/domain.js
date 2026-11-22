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
 if(typeof v!=='string'||!/^\d{1,5}(?:\.\d{1,2})?$/.test(v.trim()))fail('Enter a valid price in CAD.');
 const [d,c='']=v.trim().split('.');return Number(d)*100+Number(c.padEnd(2,'0'));
}
function create(p,t,id){
 if(!['slot','borrow','rain'].includes(p.kind))fail('Choose a product.');
 const b={id:id(),kind:p.kind,title:line(p.title,'a name'),created:t,updated:t};
 if(b.kind==='slot')Object.assign(b,{when:future(p.when,t),where:line(p.where,'the shop and location'),rules:line(p.rules,'who qualifies',240),price:sum(p.price),claim:null,closed:false});
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
 if(p.agree!==true)fail(b.kind==='slot'?'Confirm you meet the booking requirements.':'Confirm you have the item and agree to bring it back.');
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
  if(p.action==='add'){
   const title=line(p.title,'an item name');
   if(b.items.length>=100)fail('This board has reached 100 items.',409);
   if(b.items.some(i=>i.title.toLowerCase()===title.toLowerCase()))fail('That item name is already in use.',409);
   b.items.push({id:id(),title,loan:null});break;
  }
  if(p.action==='days'){b.days=loanDays(p.days);break;}
  if(p.action==='return'){const i=item(b,p.item);if(!i.loan)fail('That item is already available.',409);i.loan=null;break;}
  if(p.action==='remove'){const i=item(b,p.item);if(i.loan)fail('Mark the item returned first.',409);b.items=b.items.filter(x=>x!==i);break;}
  fail('Choose an inventory action.');
  break;
 case 'rain': {
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
  const {when,where,rules,price,claim}=b;
  return {...v,when,where,rules,price,state:slotState(b,t),...(owner&&claim?{claim:{name:claim.name,email:claim.email,at:claim.at}}:{}),...(token&&claim?.token===token?{receipt:{at:claim.at}}:{})};
 }
 if(kind==='borrow')return {...v,days:b.days,items:b.items.map(({id,title,loan})=>({id,title,state:loan?'out':'in',...(loan?{due:loan.due,...(owner?{name:loan.name,at:loan.at}:{}),...(token&&loan.token===token?{receipt:true}:{})}:{})}))};
 return {...v,when:b.when,where:b.where,updates:b.updates};
}
const api={create,act,edit,view,stages,fail};
if(typeof module==='object')module.exports=api;else root.PilotDomain=api;
})(globalThis);
