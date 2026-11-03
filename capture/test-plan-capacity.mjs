// Synthetic bootstrap fixtures exercise the real UI, not native file upload.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('review-output',{recursive:true});
const browser=await chromium.launch();const errors=[];
const assembly=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[`I${String(i).padStart(2,'0')}`,{x:i*10,slot_width:2}]));
const cases=[{n:20,added:190,remaining:0},{n:21,added:200,remaining:10},{n:100,added:10,remaining:4940}];
try{
for(const c of cases){
 const page=await browser.newPage({viewport:{width:c.n===21?390:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/example.json',route=>route.fulfill({json:{schema:1,units:'mm',assembly:assembly(c.n),coupons:{}}}));
 await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(total=>document.querySelector('#score').textContent===`0 / ${total}`,c.n*(c.n-1)/2);
 assert.equal(await page.locator('#repair').textContent(),`Add ${c.added} missing pair plans`);
 if(c.remaining)assert.match(await page.locator('#repair-hint').textContent(),new RegExp(`${c.remaining} will remain missing`));
 await page.locator('#repair').press('Enter');
 assert.equal(await page.locator('#score').textContent(),`${c.added} / ${c.added+c.remaining}`);
 assert.equal(await page.locator('#coupon option').count(),c.added);
 assert.equal(await page.locator('#repair').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'coupon');
 assert.match(await page.locator('#message').textContent(),new RegExp(`${c.remaining} relationships remain missing`));
 const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;const output=JSON.parse(await readFile(await file.path(),'utf8'));assert.equal(Object.keys(output.coupons).length,c.added);assert.deepEqual(output.assembly,assembly(c.n));
 if(c.n===21){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'review-output/capacity-390.png',fullPage:true});}
 await page.close();
}
const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
await page.route('**/example.json',route=>route.fulfill({json:{schema:1,units:'mm',assembly:{A:{x:-1000000,slot_width:2},B:{x:1000000,slot_width:2}},coupons:{}}}));
await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>document.querySelector('#score').textContent==='0 / 1');await page.locator('#repair').click();assert.equal(await page.locator('#score').textContent(),'1 / 1');assert.match(await page.locator('#coupon-table').textContent(),/A/);assert.deepEqual(errors,[]);
await writeFile('review-output/capacity-result.json',JSON.stringify({passed:true,cases,extremeCoordinates:true,errors},null,2));
}finally{await browser.close();}
