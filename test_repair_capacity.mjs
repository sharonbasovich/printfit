import assert from 'node:assert/strict';
import {addMissingPlans,compare,missingPlans} from './dist/core.mjs';
const layout=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[`Item ${i+1}`,{x:i*10,slot_width:5}]));
const freeze=value=>{Object.freeze(value);for(const child of Object.values(value))if(child&&typeof child==='object')freeze(child);return value;};
let checks=0;
function check(name,run){run();checks++;console.log(`PASS ${name}`);}
check('21 items add a bounded batch and expose remaining work',()=>{
 const a=layout(21),r=addMissingPlans(a,{});
 assert.equal(r.added,200);assert.equal(r.remaining,10);assert.equal(r.capacity,200);assert.equal(r.limitingReason,'test_limit');
 assert.equal(compare(a,r.coupons).represented,200);
 const again=addMissingPlans(a,r.coupons);assert.equal(again.added,0);assert.equal(again.remaining,10);assert.equal(again.capacity,0);assert.deepEqual(again.coupons,r.coupons);
});
check('100 items respect comparison budget without an artificial item cap',()=>{
 const a=layout(100),r=addMissingPlans(a,{});
 assert.equal(r.added,10);assert.equal(r.remaining,4940);assert.equal(r.capacity,10);assert.equal(r.limitingReason,'comparison_limit');
 assert.equal(compare(a,r.coupons).represented,10);
});
check('near comparison budget preserves existing mismatches and source',()=>{
 const a=freeze(layout(100));
 const c=freeze(Object.fromEntries(Array.from({length:9},(_,i)=>[`Existing ${i}`,{'Item 1':{x:0,slot_width:6},'Item 2':{x:10,slot_width:5}}])));
 const before=JSON.stringify({a,c}),r=addMissingPlans(a,c);
 assert.equal(r.capacity,1);assert.equal(r.added,1);assert.equal(r.remaining,4949);assert.equal(r.limitingReason,'comparison_limit');
 assert.equal(JSON.stringify({a,c}),before);for(const name of Object.keys(c))assert.deepEqual(r.coupons[name],c[name]);
 assert.equal(compare(a,r.coupons).relations.reduce((n,row)=>n+row.mismatched.length,0),9);
 const again=addMissingPlans(a,r.coupons);assert.equal(again.added,0);assert.equal(again.capacity,0);assert.equal(again.limitingReason,'comparison_limit');
});
check('name collisions and special IDs preserve exact existing tests',()=>{
 const a=freeze(Object.fromEntries(['A','B + C','A + B','C','__proto__'].map((id,i)=>[id,{x:i*10,slot_width:2}])));
 const c=freeze({'Repair A + A + B':{A:{x:0,slot_width:2}},'Repair A + A + B (2)':{A:{x:0,slot_width:2}}});
 const r=addMissingPlans(a,c);assert.equal(r.added,10);assert.equal(r.remaining,0);assert.equal(Object.keys(r.coupons).length,12);assert.ok(Object.hasOwn(r.plans,'Repair A + A + B (3)'));
 for(const name of Object.keys(c))assert.deepEqual(r.coupons[name],c[name]);assert.equal(compare(a,r.coupons).represented,10);
 assert.deepEqual(addMissingPlans(a,c),r,'Selection and names must be deterministic');
});
check('long names stay within the validation contract',()=>{
 const a={['A'.repeat(30)]:{x:0,slot_width:1},['B'.repeat(30)]:{x:2,slot_width:1}};
 const base=Object.keys(missingPlans(a,compare(a,{})))[0];
 const c=Object.fromEntries(Array.from({length:199},(_,i)=>[i?`${base} (${i+1})`:base,{['A'.repeat(30)]:a['A'.repeat(30)]}]));
 const r=addMissingPlans(a,c);assert.equal(r.added,1);assert.equal(Object.keys(r.plans)[0],`${base} (200)`);assert.ok(Object.keys(r.coupons).every(n=>n.length<=60));assert.equal(r.remaining,0);
});
check('zero relationships and fully represented projects are no-ops',()=>{
 const a=layout(1),c={};let r=addMissingPlans(a,c);assert.equal(r.added,0);assert.equal(r.remaining,0);assert.equal(r.capacity,200);assert.equal(r.limitingReason,null);assert.deepEqual(r.coupons,c);
 const b=layout(3),d={Complete:b};r=addMissingPlans(b,d);assert.equal(r.added,0);assert.equal(r.remaining,0);assert.equal(r.limitingReason,null);assert.deepEqual(r.coupons,d);
});
check('extreme and reversed centers remain valid with signed distances preserved',()=>{
 for(const [x,y] of [[-1000000,1000000],[1000000,-1000000],[-999999.1234567,999999.2345678]]){
  const a={A:{x,slot_width:5},B:{x:y,slot_width:7}},r=addMissingPlans(a,{});
  assert.equal(r.added,1);assert.equal(r.remaining,0);assert.equal(compare(a,r.coupons).represented,1);
  assert.equal(compare(a,missingPlans(a,compare(a,{}))).represented,1);
  for(const p of Object.values(r.plans))for(const v of Object.values(p))assert.ok(Math.abs(v.x)<=1000000);
 }
});
check('invalid current projects fail before adding plans',()=>{
 assert.throws(()=>addMissingPlans(layout(101),{}),/100 items/);
 assert.throws(()=>addMissingPlans(layout(2),{Unknown:{Z:{x:0,slot_width:1}}}),/unknown item/);
});
console.log(`${checks} repair-capacity scenario groups passed.`);
