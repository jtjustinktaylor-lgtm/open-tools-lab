'use strict';
const by=id=>document.getElementById(id);
const fmt=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'});
let note='';
function outputNote(focus=false){
 const v=Object.fromEntries([...new FormData(by('scope-form'))].map(([k,v])=>[k,v.trim()]));
 if(!v.job||!v.description||!v.schedule||!/^\d{1,8}(\.\d{1,2})?$/.test(v.price)||Number(v.price)<=0){
  note='';by('scope-output').textContent='Enter all fields and a price greater than zero, without a dollar sign or commas.';
 }else{
  const [whole,cents='']=v.price.split('.');
  const amount=fmt.format((Number(whole)*100+Number(cents.padEnd(2,'0')))/100);
  note=['Request to approve extra work',v.job,'',v.description,'Added price: '+amount+' ('+v.tax+').','Timing: '+v.schedule,'','Please reply in writing if you approve the scope, price, and timing. This request itself does not record an approval.'].join('\n');
  by('scope-output').textContent=note;
 }
 by('scope-copy').disabled=!note;by('scope-save').disabled=!note;by('scope-message').textContent='';
 if(focus)by('scope-output').focus();
}
by('scope-form').addEventListener('submit',event=>{event.preventDefault();outputNote(true)});
by('scope-form').addEventListener('input',()=>{
 if(!note)return;note='';by('scope-output').textContent='Inputs changed. Create a new approval request.';by('scope-message').textContent='';by('scope-copy').disabled=true;by('scope-save').disabled=true;
});
by('scope-copy').addEventListener('click',async()=>{
 if(!note)return;
 try{await navigator.clipboard.writeText(note);by('scope-message').textContent='Note copied.';}
 catch{const range=document.createRange();range.selectNodeContents(by('scope-output'));const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);by('scope-message').textContent='Note selected. Use your device’s Copy command, or download it.';}
});
by('scope-save').addEventListener('click',()=>{
 if(!note)return;
 const url=URL.createObjectURL(new Blob([note+'\n'],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='scopenote-approval-request.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const receipts={
 valid:{state:'confirmed',units:5},
 pending:{state:'pending',units:5},
 mismatch:{state:'confirmed',units:4},
 unavailable:{state:'unavailable'},
};
function meter(){
 const sample=receipts[by('meter-scenario').value];
 let verdict,detail;
 if(sample.state==='unavailable'){verdict='Verification unavailable';detail='Hold access. Ask the customer to retry verification later without sending another payment.';}
 else if(sample.state==='pending'){verdict='Payment pending';detail='Hold access. Tell the customer to wait for confirmation without paying again.';}
 else if(sample.units!==5){verdict='Amount mismatch';detail='Hold access. Expected 0.05 demo units, received '+(sample.units/100).toFixed(2)+'. Explain the mismatch to the customer.';}
 else{verdict='Ready to unlock';detail='The simulated receipt confirms the expected amount. In this example, the API can return the paid response.';}
 by('meter-result').textContent=verdict;by('meter-detail').textContent=detail;
}
by('meter-run').addEventListener('click',meter);
by('meter-scenario').addEventListener('change',()=>{by('meter-result').textContent='Scenario ready';by('meter-detail').textContent='Press Test scenario to run it.';});
outputNote();meter();

by("trade-excerpt").textContent="Nov. 15–21 UTC\n\n- 2026-11-21 · Commit on default branch · lib: legitimize `SuppressedError` as primordial\n- 2026-11-21 · Commit on default branch · test: update WPT for url to 2fa965b55c\n- 2026-11-21 · Commit on default branch · deps: update ada to 4.1.1\n\nCoverage note: nodejs/node releases: page cap reached; this list is incomplete.";
