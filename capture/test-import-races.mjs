// Deterministic delayed File.text() browser harness. No native chooser claim.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.PRINTFIT_URL||'http://127.0.0.1:4173/';
const example=JSON.parse(await readFile(new URL('../dist/example.json',import.meta.url),'utf8'));
const fixture=x=>({...structuredClone(example),assembly:{...structuredClone(example.assembly),A:{x,slot_width:4}}});
await mkdir('review-output',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],results=[];
async function start(page,id,data=fixture(111)){
  await page.evaluate(({id,data})=>{
    const file=new File([JSON.stringify(data)],`${id}.json`,{type:'application/json'});
    let resolve,reject;const pending=new Promise((a,b)=>{resolve=a;reject=b;});
    file.text=()=>pending;
    const transfer=new DataTransfer();transfer.items.add(file);
    const input=document.querySelector('#import');input.files=transfer.files;
    window.importReads??={};window.importReads[id]={resolve,reject,text:JSON.stringify(data)};
    window.importReads[id].done=input.onchange();
  },{id,data});
}
async function finish(page,id,reject=false){
  await page.evaluate(async({id,reject})=>{const r=window.importReads[id];reject?r.reject(Error('synthetic read error')):r.resolve(r.text);await r.done;},{id,reject});
}
const center=page=>page.getByLabel('Assembly A center',{exact:true}).inputValue();
async function exported(page){
  const wait=page.waitForEvent('download');await page.locator('#export').click();const d=await wait;
  return JSON.parse(await readFile(await d.path(),'utf8'));
}
try{
  for(const width of [1280,390,320]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.locator('#relations tr').first().waitFor();
    await start(page,'old');await start(page,'new',fixture(222));
    await finish(page,'old');assert.match(await page.locator('#import').inputValue(),/new.json$/);
    await finish(page,'new');assert.equal(await center(page),'222');assert.equal(await page.locator('#import').inputValue(),'');
    // A later failed selection supersedes any older success.
    await start(page,'old');await start(page,'bad',{schema:1});await finish(page,'bad');const error=await page.locator('#message').textContent();
    await finish(page,'old');assert.equal(await center(page),'222');assert.equal(await page.locator('#message').textContent(),error);
    // Repeated reset interrupts reads without allowing stale status changes.
    for(let i=0;i<2;i++){
      await start(page,`reset${i}`);await page.locator('#reset').press('Enter');await finish(page,`reset${i}`);
      assert.equal(await center(page),'0');assert.match(await page.locator('#message').textContent(),/example restored/);
    }
    // Current committed edits are protected by the existing dirty confirmation.
    await start(page,'draft');await page.getByLabel('Assembly A center',{exact:true}).fill('333');await page.getByLabel('Assembly A center',{exact:true}).press('Tab');
    page.once('dialog',d=>d.dismiss());await finish(page,'draft');assert.equal(await center(page),'333');
    // A declined latest replacement cannot resurrect an earlier read.
    await start(page,'old');await start(page,'declined',fixture(444));
    page.once('dialog',d=>d.dismiss());await finish(page,'declined');await finish(page,'old');assert.equal(await center(page),'333');
    // Stale rejection cannot erase current success; accepted import clears Undo.
    await start(page,'rejection');await start(page,'accepted',fixture(222));
    page.once('dialog',d=>d.accept());await finish(page,'accepted');await finish(page,'rejection',true);
    assert.equal(await center(page),'222');assert.match(await page.locator('#message').textContent(),/imported and validated/);
    assert.equal(await page.locator('#undo-removal').isDisabled(),true);
    // Empty/cancelled selection does not supersede a pending nonempty read.
    await start(page,'empty');await page.evaluate(()=>{const input=document.querySelector('#import');input.files=new DataTransfer().files;input.dispatchEvent(new Event('cancel'));input.onchange();});
    await finish(page,'empty');assert.equal(await center(page),'111');
    await start(page,'same',fixture(222));await finish(page,'same');await start(page,'same',fixture(222));await finish(page,'same');assert.equal(await page.locator('#import').inputValue(),'');
    // Keyboard inspection remains functional and reduced motion removes transitions.
    await page.getByRole('button',{name:'Inspect CD_wrong_slot for C and D',exact:true}).press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'inspection-title');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#reset')).transitionDuration),'0s');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`review-output/import-${width}.png`,fullPage:true});
    await page.locator('.grid > .card').nth(1).screenshot({path:`review-output/import-editors-${width}.png`});
    const project=await exported(page);assert.deepEqual(project.assembly,fixture(222).assembly);assert.deepEqual(project.coupons,example.coupons);
    assert.match(project.scope,/not physical fit/);
    results.push({width,reducedMotion:true,passed:true});await page.close();
  }
  // Fixed mobile columns must also contain the longest supported item IDs.
  const labels=await browser.newPage({viewport:{width:320,height:844}});
  labels.on('pageerror',e=>errors.push(e.message));
  const id='Synthetic_very_long_item_12345';assert.equal(id.length,30);
  await labels.route('**/example.json',route=>route.fulfill({json:{schema:1,units:'mm',assembly:{[id]:{x:0,slot_width:4},B:{x:20,slot_width:6}},coupons:{Synthetic:{[id]:{x:0,slot_width:4},B:{x:20,slot_width:6}}}}}));
  await labels.goto(base);await labels.locator('#assembly-table input').first().waitFor();
  assert.equal(await labels.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await labels.locator('#assembly-table td:first-child, #coupon-table td:first-child').evaluateAll(xs=>xs.every(e=>e.scrollWidth<=e.clientWidth+1)),true);
  await labels.locator('.grid').screenshot({path:'review-output/import-long-label-320.png'});
  await labels.close();
  assert.deepEqual(errors,[]);
  await writeFile('review-output/import-results.json',JSON.stringify({base,results,errors,nativeChooser:false},null,2));
  console.log('PASS delayed browser imports, repeated/interrupted flows, keyboard, export evidence and reduced motion at 1280/390/320px');
}finally{await browser.close();}
