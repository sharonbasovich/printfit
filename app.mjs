import {compare,addMissingPlans,readProject} from './core.mjs';
import {filterRelations,inspectionDetails} from './review.mjs';
let example=await(await fetch('./example.json')).json(), project=structuredClone(example), selected=Object.keys(project.coupons)[0], dirty=false,page=0,filter='all',inspection=null, removal=null;
const $=id=>document.getElementById(id), escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A nonempty selection supersedes every older read, even if it later fails
// validation or replacement is declined. Only the owning request may clean up.
let importGeneration=0;
function message(text){$('message').textContent=text;}
function plot(layout){const values=Object.values(layout), low=Math.min(...values.map(i=>i.x-i.slot_width/2)),high=Math.max(...values.map(i=>i.x+i.slot_width/2)),other=Object.values(project.assembly),current=Object.values(project.coupons[selected]||project.assembly),extent=v=>Math.max(...v.map(i=>i.x+i.slot_width/2))-Math.min(...v.map(i=>i.x-i.slot_width/2)),span=Math.max(1,extent(other),extent(current)),pos=x=>24+(x-low)/span*432;return `<svg class="diagram" viewBox="0 0 480 116" role="img" aria-label="Nominal slot arrangement on shared scale; each origin normalized"><line x1="24" y1="70" x2="456" y2="70" stroke="#829779"/>${Object.entries(layout).map(([id,i])=>`<rect x="${pos(i.x-i.slot_width/2)}" y="46" width="${Math.max(2,i.slot_width/span*432)}" height="45" rx="2" fill="#38634c"/><text x="${pos(i.x)}" y="31" text-anchor="middle" font-size="14" fill="#21342c">${escape(id)}</text><text x="${pos(i.x)}" y="108" text-anchor="middle" font-size="11" fill="#526157">${i.x} mm</text>`).join('')}</svg>`;}
function table(layout,kind){return `<table><thead><tr><th>Item</th><th>Center (mm)</th><th>Slot width (mm)</th></tr></thead><tbody>${Object.entries(layout).map(([id,i])=>`<tr><td>${escape(id)}</td>${['x','slot_width'].map(key=>`<td><input type="number" step="any" data-kind="${kind}" data-id="${escape(id)}" data-key="${key}" aria-label="${escape(kind==='assembly'?'Assembly':selected)} ${escape(id)} ${key==='x'?'center':'slot width'}" value="${i[key]}"></td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function render(refreshEditors=true){try{$('remove-test').disabled=!selected;$('undo-removal').disabled=!removal;const r=compare(project.assembly,project.coupons);$('assembly-plot').innerHTML=plot(project.assembly);if(refreshEditors)$('assembly-table').innerHTML=table(project.assembly,'assembly');if(refreshEditors)$('coupon').innerHTML=Object.keys(project.coupons).map(name=>`<option value="${escape(name)}">${escape(name)}</option>`).join('');if(!Object.hasOwn(project.coupons,selected))selected=Object.keys(project.coupons)[0];$('coupon').value=selected;
if(selected){$('coupon-plot').innerHTML=plot(project.coupons[selected]);if(refreshEditors)$('coupon-table').innerHTML=table(project.coupons[selected],'coupon');}else{$('coupon-plot').textContent='No test pieces yet.';$('coupon-table').textContent='Add missing pair plans to begin.';}
$('score').textContent=`${r.represented} / ${r.total}`;const bad=r.relations.reduce((n,x)=>n+x.mismatched.length,0);$('summary').textContent=`${r.total-r.represented} missing relationship${r.total-r.represented===1?'':'s'} · ${bad} mismatch${bad===1?'':'es'} to inspect`;const missing=r.total-r.represented,capacity=Math.max(0,Math.min(200,r.total?Math.floor(50000/r.total):200)-Object.keys(project.coupons).length),batch=Math.min(missing,capacity);$('repair').disabled=!batch;$('repair').textContent=batch?`Add ${batch} missing pair plan${batch===1?'':'s'}`:'Add missing pair plans';$('repair-hint').textContent=!missing?'All nominal relationships are represented. Existing mismatches still need inspection.':!capacity?`${missing} relationships remain missing. The project has reached its test-piece or comparison limit. Inspect existing tests or create a smaller project before adding more pair plans.`:batch<missing?`Adds ${batch} of ${missing} missing relationships within the existing project limits. ${missing-batch} will remain missing. Existing tests are kept.`:`Adds all ${missing} missing nominal relationship${missing===1?'':'s'}. Existing mismatches are kept; physical fit is not verified.`;
const rows=filterRelations(r.relations,filter);
page=Math.max(0,Math.min(page,Math.ceil(rows.length/50)-1));$('page').textContent=`Showing ${rows.length?page*50+1:0}–${Math.min((page+1)*50,rows.length)} of ${rows.length} matching relationships (${r.total} total)`;$('previous').disabled=page===0;$('next').disabled=(page+1)*50>=rows.length;
$('relations').innerHTML=rows.slice(page*50,(page+1)*50).map(row=>`<tr><td><b>${row.pair.map(escape).join(' ↔ ')}</b></td><td>${row.signed_distance_mm} mm</td><td>${row.represented_by.length?row.represented_by.slice(0,3).map(n=>`<span class="badge">${escape(n)}</span>`).join(' ')+(row.represented_by.length>3?` <span class="fine">+${row.represented_by.length-3} more in exported project</span>`:''):'<span class="badge warn">Missing</span>'}</td><td>${row.mismatched.length?row.mismatched.slice(0,3).map(m=>`<div class="finding"><b>${escape(m.coupon)}</b>: ${m.reasons.map(escape).join(', ')}<button type="button" class="inspect" data-inspect="${escape(m.coupon)}" data-pair="${escape(JSON.stringify(row.pair))}" aria-label="Inspect ${escape(m.coupon)} for ${row.pair.map(escape).join(' and ')}">Inspect dimensions</button></div>`).join('<br>')+(row.mismatched.length>3?`<br>+${row.mismatched.length-3} more; inspect their test pieces`:''):'—'}</td></tr>`).join('');
$('empty-results').hidden=rows.length!==0;
renderInspection();
}catch(e){message(e.message);}}

function renderInspection(){
  const details=inspection&&selected===inspection.coupon?inspectionDetails(project.assembly,project.coupons[selected],inspection.pair):[];
  $('inspection').hidden=!details.length;
  if(!details.length)return;
  $('inspection-title').textContent=`Inspect ${inspection.pair.join(' ↔ ')} in ${selected}`;
  $('inspection-values').innerHTML=details.map(d=>`<tr><th scope="row">${escape(d.label)}</th><td>${d.expected} mm</td><td>${d.actual} mm <span class="badge ${d.mismatch?'warn':''}">${d.mismatch?'Mismatch':'Matches'}</span></td></tr>`).join('');
  $('inspection-summary').textContent=details.some(d=>d.mismatch)?'Compare these values, then edit the test piece below. Relative spacing uses both centers.':'These nominal dimensions now match. This is not a physical-fit result.';
}
$('relation-filter').onchange=()=>{filter=$('relation-filter').value;page=0;render(false);};
$('relations').onclick=e=>{
  const button=e.target.closest('button[data-inspect]');if(!button)return;
  selected=button.dataset.inspect;inspection={coupon:selected,pair:JSON.parse(button.dataset.pair)};
  render();$('inspection-title').focus();
};
$('back-findings').onclick=()=>{
  const target=[...$('relations').querySelectorAll('button[data-inspect]')].find(b=>b.dataset.inspect===inspection?.coupon&&b.dataset.pair===JSON.stringify(inspection.pair));
  (target||$('findings-title')).focus();
};

document.addEventListener('change',e=>{const el=e.target;if(!el.dataset.kind)return; const copy=structuredClone(project),layout=el.dataset.kind==='assembly'?copy.assembly:copy.coupons[selected];layout[el.dataset.id][el.dataset.key]=el.value.trim()===''?NaN:Number(el.value);try{compare(copy.assembly,copy.coupons);project=copy;removal=null;dirty=true;render(false);message('Dimensions updated. Export to keep your changes.');}catch(error){message(`${error.message} Your previous value was kept.`);el.value=(el.dataset.kind==='assembly'?project.assembly:project.coupons[selected])[el.dataset.id][el.dataset.key];}});
$('previous').onclick=()=>{page--;render(false);};$('next').onclick=()=>{page++;render(false);};
$('coupon').onchange=()=>{selected=$('coupon').value;inspection=null;render();};
$('repair').onclick=()=>{try{const result=addMissingPlans(project.assembly,project.coupons);if(!result.added){message(result.remaining?`${result.remaining} relationships remain missing. No room for more pair plans within the project limits; existing project kept.`:'No missing pair plans to add. Existing project kept.');return;}project={...project,coupons:result.coupons};removal=null;selected=Object.keys(result.plans).at(-1);inspection=null;dirty=true;render();message(`${result.added} nominal pair plan${result.added===1?'':'s'} added. ${result.remaining} relationships remain missing.${result.remaining?' Project capacity reached; inspect existing tests or use a smaller project.':''} Existing mismatches remain visible. No physical fit is implied.`);$('coupon').focus();}catch(e){message(`Plans not added: ${e.message} Existing project kept.`);}};
$('remove-test').onclick=()=>{
  if(!selected||!Object.hasOwn(project.coupons,selected))return;
  const name=selected;
  if(!confirm(`Remove test piece “${name}”? Its evidence will no longer count. Missing relationships may increase. You can undo this removal until the next project change.`)){$('remove-test').focus();return;}
  removal={project:structuredClone(project),selected,inspection:structuredClone(inspection),page,filter};
  const names=Object.keys(project.coupons),index=names.indexOf(name),copy=structuredClone(project);
  delete copy.coupons[name];project=copy;selected=Object.keys(project.coupons)[Math.min(index,Object.keys(project.coupons).length-1)];inspection=null;dirty=true;
  render();message(`Removed ${name}. Coverage recalculated without that test. Undo is available until the next project change.`);$('undo-removal').focus();
};
$('undo-removal').onclick=()=>{
  if(!removal)return;
  ({project,selected,inspection,page,filter}=removal);removal=null;dirty=true;$('relation-filter').value=filter;
  render();message('Removed test restored with its original dimensions and order. Export to keep your changes.');$('remove-test').focus();
};
$('reset').onclick=()=>{if(dirty&&!confirm('Discard unexported changes and reload the synthetic example?'))return;importGeneration++;$('import').value='';removal=null;project=structuredClone(example);selected=Object.keys(project.coupons)[0];dirty=false;inspection=null;page=0;render();message('Synthetic example restored.');};
$('export').onclick=()=>{const data={...project,scope:'Nominal pairwise center/slot-width correspondence only; not physical fit'};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='printfit-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Download requested. Keep this page open until you confirm the file was saved; the unsaved-change guard remains active.');};
$('import').onchange=async()=>{
  const input=$('import'),file=input.files[0];
  if(!file)return;
  const request=++importGeneration;
  try{
    if(file.size>1000000)throw Error('Use a project smaller than 1 MB.');
    const text=await file.text();
    if(request!==importGeneration)return;
    const next=readProject(JSON.parse(text));
    if(dirty&&!confirm('Replace your unexported changes with this file?'))return;
    removal=null;project=next;selected=Object.keys(project.coupons)[0];dirty=false;inspection=null;page=0;render();
    message('Project imported and validated. Nominal geometry restored; physical fit remains unverified.');
  }catch(e){if(request===importGeneration)message(`Import not applied: ${e.message}`);}
  finally{if(request===importGeneration)input.value='';}
};

$('add-item').onsubmit=e=>{e.preventDefault();try{const id=$('new-id').value.trim(),x=Number($('new-center').value),slot_width=Number($('new-width').value);if(!id||Object.hasOwn(project.assembly,id))throw Error('Choose a new nonempty item ID.');const copy=structuredClone(project);copy.assembly={...copy.assembly,[id]:{x,slot_width}};compare(copy.assembly,copy.coupons);project=copy;removal=null;dirty=true;render();$('add-item').reset();message(`Item ${id} added. Its relationships need test plans.`);}catch(e){message(e.message);}};
$('add-coupon').onsubmit=e=>{e.preventDefault();try{const name=$('new-coupon').value.trim(),ids=$('coupon-ids').value.split(',').map(x=>x.trim());if(!name||Object.hasOwn(project.coupons,name))throw Error('Choose a new test-piece name.');if(new Set(ids).size!==ids.length||ids.some(id=>!Object.hasOwn(project.assembly,id)))throw Error('Use each known item ID once, separated by commas.');const copy=structuredClone(project);copy.coupons={...copy.coupons,[name]:Object.fromEntries(ids.map(id=>[id,structuredClone(project.assembly[id])]))};compare(copy.assembly,copy.coupons);project=copy;removal=null;selected=name;dirty=true;render();$('add-coupon').reset();message('Test piece created at intended dimensions. Edit it to match your actual design; no physical test has occurred.');}catch(e){message(e.message);}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});render();

