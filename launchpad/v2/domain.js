(function (root) {
 'use strict';
 const kinds=['bench','drop','tag'];
 const caps={bench:24,drop:500,tag:100};
 const currencies=['CAD','USD','EUR','GBP'];
 const error=(message,status=400)=>Object.assign(new Error(message),{status});
 function field(value,max,label,optional=false){
  const s=typeof value==='string'?value.trim():'';
  if(!optional&&!s)throw error('Enter '+label+'.');
  if(s.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s))throw error('Keep '+label+' to '+max+' characters.');
  return s;
 }
 function qty(value,max,label){
  const s=String(value);
  if(!/^\d{1,4}$/.test(s)||+s<1||+s>max)throw error(label+' must be from 1 to '+max+'.');
  return +s;
 }
 function pricing(price,currency){
  const clean=typeof price==='string'?price.trim():'';
  if(!clean)return {unitCents:null,currency:'CAD'};
  if(!/^\d{1,5}(\.\d{1,2})?$/.test(clean)||!currencies.includes(currency))throw error('Enter a price per item using up to two decimals and choose a currency.');
  const [left,right='']=clean.split('.');
  return {unitCents:Number(left)*100+Number(right.padEnd(2,'0')),currency};
 }
 function board(input){
  if(!input||!kinds.includes(input.kind))throw error('Choose a product.');
  const k=input.kind;
  return {kind:k,title:field(input.title,80,k==='tag'?'an item label':'a title'),when:k==='tag'?'':field(input.when,85,k==='bench'?'the game time':'the pickup time'),where:k==='tag'?'':field(input.where,100,k==='bench'?'the venue':'the general pickup location'),note:field(input.note,420,'details',true),capacity:k==='tag'?caps.tag:qty(input.capacity,caps[k],k==='bench'?'Spots':'Stock'),...(k==='drop'?pricing(input.price,input.currency):{}),...(k==='bench'?{waitlist:input.waitlist===true}:{}),...(k==='tag'?{recovered:false}:{})};
 }
 function entry(input,kind,boardLimit=caps[kind]){
  const name=field(input?.name,70,'your name');
  const email=field(input?.email,160,'a reply email').toLowerCase();
  if(!/^[^\s@<>;,?&#%]+@[^\s@<>;,?&#%]+\.[^\s@<>;,?&#%]+$/.test(email))throw error('Enter a valid reply email.');
  return {name,email,note:field(input?.note,420,kind==='tag'?'where you found the item':'notes',kind!=='tag'),quantity:kind==='drop'?qty(input?.quantity,boardLimit,'Quantity'):1};
 }
 const waiting=b=>b.entries.filter(r=>r.state==='waiting');
 function availability(b){return Math.max(0,b.capacity-b.entries.reduce((sum,r)=>sum+(r.state==='waiting'?0:r.quantity),0));}
 function add(b,input,createId,createSecret){
  if(b.closed)throw error('This page is closed.',409);
  const available=availability(b), backedUp=b.kind==='bench'&&available===0&&b.waitlist&&input?.backup===true;
  if(b.kind!=='tag'&&available===0&&!backedUp)throw error(b.kind==='bench'?'All spots have been claimed. Refresh to check availability.':'This drop is sold out.',409);
  const v=entry(input,b.kind,b.capacity);
  if(b.entries.some(r=>r.email===v.email&&(b.kind!=='tag'||r.note===v.note)))throw error(b.kind==='tag'?'This report was already submitted.':'That email already has an entry. Ask the organizer if you need a change.',409);
  if(backedUp&&waiting(b).length>=caps.bench)throw error('The backup list is full.',409);
  if(!backedUp&&v.quantity>available)throw error(b.kind==='tag'?'This tag cannot accept more reports right now.':'There are only '+available+' left.',409);
  const r={...v,id:createId(),createdAt:new Date().toISOString(),state:backedUp?'waiting':'confirmed',...(b.kind!=='tag'?{receiptKey:createSecret()}:{}),...(b.kind==='drop'&&Number.isInteger(b.unitCents)?{totalCents:b.unitCents*v.quantity}:{})};
  b.entries.push(r);return r;
 }
 function fillFromBackups(b){
  if(b.kind==='bench'&&!b.closed){let open=availability(b);for(const r of waiting(b)){if(open<=0)break;r.state='confirmed';r.promoted=true;open--;}}
 }
 function adjust(b,action,entryId){
  switch(action){
   case 'close':b.closed=true;break;
   case 'reopen':if(b.kind==='tag')b.recovered=false;b.closed=false;fillFromBackups(b);break;
   case 'recover':if(b.kind!=='tag')throw error('Only ClaimTag items can be marked recovered.');b.recovered=true;b.closed=true;break;
   case 'remove':b.entries=b.entries.filter(e=>e.id!==entryId);fillFromBackups(b);break;
   default:throw error('Unknown action.');
  }
 }
 function receipt(b,token){
  if(!token)throw error('That private status link could not be found.',404);
  const r=b.entries.find(e=>e.receiptKey===token);
  if(!r)throw error('That status link could not be found. The organizer may have removed the entry.',404);
  return {state:r.state,quantity:r.quantity,totalCents:r.totalCents,promoted:r.promoted===true};
 }
 function view(b,owner=false){
  const {id,kind,title,when,where,note,capacity,closed}=b, remaining=availability(b);
  const extra=kind==='bench'?{waitlistOpen:!closed&&b.waitlist===true&&waiting(b).length<caps.bench}:kind==='drop'?{unitCents:b.unitCents??null,currency:b.currency||'CAD'}:{recovered:b.recovered===true};
  return {id,kind,title,when,where,note,capacity,closed,remaining:kind==='tag'?undefined:remaining,...extra,...(owner?{entries:b.entries.map(({receiptKey,...entry})=>entry)}:{})};
 }
 const api={kinds,currencies,caps,error,board,entry,add,view,adjust,receipt};
 if(typeof module==='object')module.exports=api;else root.LaunchDomain=api;
})(globalThis);
