// CI-only continuous capture of real UI interactions on synthetic dimensions.
// No injected state, mocked results, uploads or physical-fit assertions.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
await fs.mkdir('capture-output',{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'capture-output',size:{width:1440,height:900}}});
const page=await context.newPage(),errors=[],events=[];let start;
const at=async s=>{const d=s*1000-(performance.now()-start);if(d>0)await page.waitForTimeout(d);};
const event=name=>events.push({name,seconds:(performance.now()-start)/1000});
page.on('pageerror',e=>errors.push(String(e)));
try {
 await page.goto('http://127.0.0.1:4173/');start=performance.now();
 assert.equal(await page.locator('#score').innerText(),'5 / 6');event('synthetic example, 5 of 6');
 await at(12);await page.locator('#score').scrollIntoViewIfNeeded();
 await page.screenshot({path:'capture-output/baseline.png'});event('missing AD and two mismatched test pieces visible');
 await at(29);await page.locator('#coupon').selectOption('BC_wrong_spacing');await page.locator('#coupon').scrollIntoViewIfNeeded();
 await at(41);const center=page.locator('input[data-kind="coupon"][data-id="C"][data-key="x"]');
 assert.equal(await center.inputValue(),'25');await center.fill('30');await center.press('Tab');
 assert.equal(await page.locator('#score').innerText(),'5 / 6');assert.match(await page.locator('#summary').innerText(),/1 mismatch/);event('BC correction preserves coverage, removes one mismatch');
 await at(53);await page.locator('#score').scrollIntoViewIfNeeded();await page.screenshot({path:'capture-output/corrected.png'});
 await at(65);await page.locator('#repair').click();
 assert.equal(await page.locator('#score').innerText(),'6 / 6');assert.match(await page.locator('#summary').innerText(),/1 mismatch/);
 event('missing AD plan added, independent CD warning remains');
 await page.locator('#score').scrollIntoViewIfNeeded();await page.screenshot({path:'capture-output/repaired.png'});
 await at(83);const promise=page.waitForEvent('download');await page.locator('#export').click();const download=await promise;await download.saveAs('capture-output/printfit-project.json');
 const exported=JSON.parse(await fs.readFile('capture-output/printfit-project.json','utf8'));
 assert.equal(exported.coupons.BC_wrong_spacing.C.x,30);assert.equal(exported.coupons.CD_wrong_slot.D.slot_width,7);
 assert.ok(Object.values(exported.coupons).some(c=>Object.keys(c).length===2&&c.A&&c.D&&c.D.x-c.A.x===90));
 assert.match(await page.locator('#message').innerText(),/Download requested/);event('actual download verified against UI edits');
 await at(96);await page.locator('.limits summary').click();await page.locator('.limits').scrollIntoViewIfNeeded();
 await page.screenshot({path:'capture-output/limitations.png'});event('physical-fit limitations visible');
 await at(120);assert.deepEqual(errors,[]);
 await fs.writeFile('capture-output/audit.json',JSON.stringify({commit:process.env.GITHUB_SHA,events,errors,elapsedSeconds:(performance.now()-start)/1000,scope:'Continuous scripted real-browser workflow using synthetic data. Silent continuous capture; captions not yet added; no user study or physical measurement. No import test.'},null,2));
} catch(e){await fs.writeFile('capture-output/failure.json',JSON.stringify({error:String(e),events,errors},null,2));await page.screenshot({path:'capture-output/failure.png'}).catch(()=>{});throw e;}
finally{await context.close();await browser.close();}
