import assert from 'node:assert/strict';
import {readProject} from './dist/core.mjs';
const assembly={A:{x:0,slot_width:1},B:{x:2,slot_width:1}};
for(const name of ['', '   ', 'X'.repeat(61)]) {
  assert.throws(()=>readProject({schema:1,units:'mm',assembly,coupons:{[name]:assembly}}),`Invalid coupon label must be rejected: ${JSON.stringify(name)}`);
}
console.log('Independent imported coupon-name validation passed.');
const {compare,missingPlans}=await import('./dist/core.mjs');
const largeAssembly=Object.fromEntries(Array.from({length:100},(_,i)=>[`I${i}`,{x:i,slot_width:1}]));
const ten=Object.fromEntries(Array.from({length:10},(_,i)=>[`C${i}`,largeAssembly]));
assert.equal(compare(largeAssembly,ten).total,4950);
assert.throws(()=>compare(largeAssembly,{...ten,C10:largeAssembly}),/50,000/);
const longAssembly={['A'.repeat(30)]:{x:0,slot_width:1},['B'.repeat(30)]:{x:2,slot_width:1}};
const longPlans=missingPlans(longAssembly,compare(longAssembly,{}));
assert.equal(compare(longAssembly,longPlans).represented,1,'Generated names must fit the same supported label limits');
