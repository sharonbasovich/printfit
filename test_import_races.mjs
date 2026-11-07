// Runs the actual app module with deterministic file reads and a minimal DOM.
// This is a race harness, not native browser file-chooser verification.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as core from './dist/core.mjs';
import * as review from './dist/review.mjs';
const source=await readFile(process.env.PRINTFIT_APP||new URL('./dist/app.mjs',import.meta.url),'utf8');
const example=JSON.parse(await readFile(new URL('./dist/example.json',import.meta.url),'utf8'));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const fixture=x=>({...structuredClone(example),assembly:{...structuredClone(example.assembly),A:{x,slot_width:5}}});
async function boot(){
  const elements=new Map(),listeners={},prompts=[];
  const document={getElementById(id){if(!elements.has(id))elements.set(id,{id,value:'',textContent:'',innerHTML:'',files:[],dataset:{},focus(){},reset(){},querySelectorAll(){return [];}});return elements.get(id);},addEventListener(name,fn){listeners[name]=fn;}};
  const window={addEventListener(name,fn){listeners[name]=fn;}};
  let accept=true;
  const run=new AsyncFunction('compare','addMissingPlans','readProject','filterRelations','inspectionDetails','document','window','fetch','confirm',source.replace(/^import .*;\r?\n/gm,'')+'\nreturn {snapshot:()=>structuredClone({project,selected,dirty,removal})};');
  const app=await run(core.compare,core.addMissingPlans,core.readProject,review.filterRelations,review.inspectionDetails,document,window,async()=>({json:async()=>structuredClone(example)}),text=>{prompts.push(text);return accept;});
  const el=id=>document.getElementById(id);
  return {snapshot:app.snapshot,el,prompts,listeners,setAccept:value=>accept=value,
    start(file){el('import').files=file?[file]:[];el('import').value=file?'selected.json':'';return el('import').onchange();},
    read(){const d=deferred();return {...d,file:{size:100,text:()=>d.promise}};},
    edit(value){listeners.change({target:{dataset:{kind:'assembly',id:'A',key:'x'},value:String(value)}});}};
}
const cases=[];
async function test(name,fn){try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false,error:e.message});}}
await test('latest nonempty selection wins in both completion orders',async()=>{
  for(const latestFirst of [true,false]){
    const a=await boot(),old=a.read(),next=a.read(),p=a.start(old.file),q=a.start(next.file);
    const finishOld=async()=>{old.resolve(JSON.stringify(fixture(111)));await p;};
    const finishNext=async()=>{next.resolve(JSON.stringify(fixture(222)));await q;};
    if(latestFirst){await finishNext();await finishOld();}else{await finishOld();assert.deepEqual(a.snapshot().project,example);assert.equal(a.el('import').value,'selected.json');await finishNext();}
    assert.equal(a.snapshot().project.assembly.A.x,222);assert.equal(a.el('import').value,'');
  }
});
await test('newer malformed, oversized, invalid-schema and rejected reads supersede older success',async()=>{
  for(const file of [{size:100,text:async()=>'{bad'},{size:1000001,text:()=>{throw Error('must not read');}},{size:100,text:async()=>'{"schema":1}'},{size:100,text:async()=>{throw Error('synthetic rejection');}}]){
    const a=await boot(),d=a.read(),p=a.start(d.file);await a.start(file);const message=a.el('message').textContent;
    d.resolve(JSON.stringify(fixture(111)));await p;assert.deepEqual(a.snapshot().project,example);assert.match(message,/Import not applied/);assert.equal(a.el('message').textContent,message);
  }
});
await test('declined latest replacement cannot resurrect an older import or erase Undo',async()=>{
  const a=await boot();a.el('remove-test').onclick();const before=a.snapshot(),d=a.read(),p=a.start(d.file);a.setAccept(false);
  await a.start({size:100,text:async()=>JSON.stringify(fixture(222))});a.setAccept(true);d.resolve(JSON.stringify(fixture(111)));await p;
  assert.deepEqual(a.snapshot(),before);assert.equal(a.prompts.length,2);assert.equal(a.el('import').value,'');
});
await test('accepted reset invalidates pending success and rejection on pristine or dirty workspace',async()=>{
  for(const dirty of [false,true])for(const reject of [false,true]){
    const a=await boot();if(dirty)a.edit(333);const d=a.read(),p=a.start(d.file);a.el('reset').onclick();
    reject?d.reject(Error('stale')):d.resolve(JSON.stringify(fixture(111)));await p;
    assert.deepEqual(a.snapshot().project,example);assert.equal(a.snapshot().dirty,false);assert.match(a.el('message').textContent,/example restored/);assert.equal(a.el('import').value,'');
  }
});
await test('declined reset leaves pending import eligible for its own dirty confirmation',async()=>{
  for(const accept of [false,true]){
    const a=await boot();a.edit(333);const d=a.read(),p=a.start(d.file);a.setAccept(false);a.el('reset').onclick();a.setAccept(accept);
    d.resolve(JSON.stringify(fixture(111)));await p;assert.equal(a.snapshot().project.assembly.A.x,accept?111:333);assert.equal(a.snapshot().dirty,!accept);assert.equal(a.prompts.length,2);
  }
});
await test('empty picker leaves an existing read eligible',async()=>{
  const a=await boot(),d=a.read(),p=a.start(d.file);await a.start(null);d.resolve(JSON.stringify(fixture(111)));await p;assert.equal(a.snapshot().project.assembly.A.x,111);
  assert.equal(a.el('import').onclick,undefined);assert.equal(a.el('import').oncancel,undefined);
});
await test('edits during read use current dirty state and respect accept or decline',async()=>{
  for(const accept of [false,true]){
    const a=await boot(),d=a.read(),p=a.start(d.file);a.edit(333);a.setAccept(accept);d.resolve(JSON.stringify(fixture(111)));await p;
    assert.equal(a.snapshot().project.assembly.A.x,accept?111:333);assert.equal(a.snapshot().dirty,!accept);assert.equal(a.prompts.length,1);
  }
});
await test('repair, creation, removal and Undo during read retain replacement confirmation',async()=>{
  for(const action of ['repair','add-item','add-coupon','remove-test','undo-removal']){
    const a=await boot(),d=a.read(),p=a.start(d.file);
    if(action==='repair'||action==='remove-test')a.el(action).onclick();
    else if(action==='undo-removal'){a.el('remove-test').onclick();a.el('undo-removal').onclick();}
    else{for(const [id,value] of Object.entries({'new-id':'E','new-center':'90','new-width':'4','new-coupon':'New test','coupon-ids':'A, B'}))a.el(id).value=value;a.el(action).onsubmit({preventDefault(){}});}
    const before=a.snapshot(),prompts=a.prompts.length;a.setAccept(false);d.resolve(JSON.stringify(fixture(111)));await p;
    assert.deepEqual(a.snapshot(),before);assert.equal(a.prompts.length,prompts+1);
  }
});
await test('obsolete rejection cannot overwrite latest success or clear newer input',async()=>{
  for(const latestFirst of [false,true]){
    const a=await boot(),old=a.read(),next=a.read(),p=a.start(old.file),q=a.start(next.file);
    if(latestFirst){next.resolve(JSON.stringify(fixture(222)));await q;old.reject(Error('old read failed'));await p;assert.match(a.el('message').textContent,/imported and validated/);}
    else{old.reject(Error('old read failed'));await p;assert.equal(a.el('import').value,'selected.json');next.resolve(JSON.stringify(fixture(222)));await q;}
    assert.equal(a.snapshot().project.assembly.A.x,222);
  }
});
await test('same file may be selected again after success, failure or declined replacement',async()=>{
  for(const outcome of ['success','failure','declined']){
    const a=await boot(),file={size:100,text:async()=>JSON.stringify(fixture(222))};
    if(outcome==='failure')file.text=async()=>'{bad';
    if(outcome==='declined'){a.edit(333);a.setAccept(false);}
    await a.start(file);assert.equal(a.el('import').value,'');a.setAccept(true);file.text=async()=>JSON.stringify(fixture(444));await a.start(file);
    assert.equal(a.snapshot().project.assembly.A.x,444);assert.equal(a.el('import').value,'');
  }
});
await test('accepted dirty import is atomic, clears Undo, keeps geometry scope and validation',async()=>{
  const a=await boot();a.el('remove-test').onclick();const before=a.snapshot();await a.start({size:1000001,text:()=>{throw Error('must not read');}});assert.deepEqual(a.snapshot(),before);
  await a.start({size:100,text:async()=>JSON.stringify({schema:1,assembly:{},coupons:{}})});assert.deepEqual(a.snapshot(),before);
  await a.start({size:100,text:async()=>JSON.stringify(fixture(222))});assert.equal(a.snapshot().project.assembly.A.x,222);assert.equal(a.snapshot().removal,null);assert.equal(a.snapshot().dirty,false);assert.equal(a.prompts.length,2);
});
for(const c of cases)console.log(`${c.passed?'PASS':'FAIL'} ${c.name}${c.error?' - '+c.error:''}`);
assert.ok(cases.every(c=>c.passed),`${cases.filter(c=>!c.passed).length}/${cases.length} import race groups failed`);
