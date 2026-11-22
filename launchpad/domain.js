(function (root) {
 'use strict';
 const kinds=['bench','drop','tag'];
 const states={bench:'spots',drop:'units',tag:'reports'};
 const caps={bench:24,drop:500,tag:100};
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
 function board(input){
  if(!input||!kinds.includes(input.kind))throw error('Choose a product.');
  const k=input.kind;
  return {kind:k,title:field(input.title,80,k==='tag'?'an item label':'a title'),when:k==='tag'?'':field(input.when,85,k==='bench'?'the game time':'the pickup time'),where:k==='tag'?'':field(input.where,100,k==='bench'?'the venue':'the general pickup location'),note:field(input.note,420,'details',true),capacity:k==='tag'?caps.tag:qty(input.capacity,caps[k],k==='bench'?'Spots':'Stock')};
 }
 function entry(input,kind,boardLimit=caps[kind]){
  const name=field(input?.name,70,'your name');
  const email=field(input?.email,160,'a reply email').toLowerCase();
  if(!/^[^\s@<>;,?&#%]+@[^\s@<>;,?&#%]+\.[^\s@<>;,?&#%]+$/.test(email))throw error('Enter a valid reply email.');
  return {name,email,note:field(input?.note,420,kind==='tag'?'where you found the item':'notes',kind!=='tag'),quantity:kind==='drop'?qty(input?.quantity,boardLimit,'Quantity'):1};
 }
 function availability(b){return Math.max(0,b.capacity-b.entries.reduce((sum,r)=>sum+r.quantity,0));}
 function add(b,input,createId){
  if(b.closed)throw error('This page is closed.',409);
  if(b.kind!=='tag'&&availability(b)===0)throw error(b.kind==='bench'?'All spots have been claimed.':'This drop is sold out.',409);
  const v=entry(input,b.kind,b.capacity);
  if(b.entries.some(r=>r.email===v.email&&(b.kind!=='tag'||r.note===v.note)))throw error(b.kind==='tag'?'This report was already submitted.':'That email already has a spot or reservation. Ask the organizer if you need a change.',409);
  if(v.quantity>availability(b))throw error(b.kind==='tag'?'This tag cannot accept more reports right now.':'There are only '+availability(b)+' left.',409);
  b.entries.push({...v,id:createId(),createdAt:new Date().toISOString()});
 }
 function view(b,owner=false){
  const {id,kind,title,when,where,note,capacity,closed}=b, remaining=availability(b);
  return {id,kind,title,when,where,note,capacity,closed,remaining:kind==='tag'?undefined:remaining,...(owner?{entries:b.entries}:{})};
 }
 const api={kinds,states,caps,error,board,entry,add,view};
 if(typeof module==='object')module.exports=api;else root.LaunchDomain=api;
})(globalThis);
