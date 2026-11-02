export function validate(layout) {
  if (!layout || Array.isArray(layout) || typeof layout !== 'object' || !Object.keys(layout).length) throw Error('Add at least one item.');
  if(Object.keys(layout).length>100) throw Error('Prototype limit: 100 items per layout.');
  for (const [name,item] of Object.entries(layout)) {
    if (!name.trim() || name.includes(',') || name.length>30 || !item || !Number.isFinite(item.x) || !Number.isFinite(item.slot_width) || item.slot_width <= 0 || Math.abs(item.x)>1000000 || item.slot_width>1000000) throw Error('Each item needs an ID of 1–30 characters without commas, center within ±1,000,000 mm and slot width from 0 to 1,000,000 mm (positive).');
  }
}
export function compare(assembly,coupons) {
  validate(assembly);
  if (!coupons || Array.isArray(coupons) || typeof coupons !== 'object') throw Error('Coupons must be an object.');
  if(Object.keys(coupons).length>200) throw Error('Prototype limit: 200 test pieces.');
  if(Object.keys(assembly).length*(Object.keys(assembly).length-1)/2*Object.keys(coupons).length>50000) throw Error('This review build supports at most 50,000 pair–test comparisons per project.');
  for (const [name,c] of Object.entries(coupons)) {if(!name.trim()||name.length>60)throw Error('Each test piece needs a name of 1–60 characters.');validate(c); if(Object.keys(c).some(id=>!Object.hasOwn(assembly,id))) throw Error('Coupon contains an unknown item ID.');}
  const ids=Object.keys(assembly).sort(), relations=[];
  for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) {
    const a=ids[i],b=ids[j],distance=assembly[b].x-assembly[a].x;
    if(!Number.isFinite(distance)) throw Error('Relative center distance is too large.');
    const represented_by=[],mismatched=[];
    for(const [name,c] of Object.entries(coupons)) {
      if(!Object.hasOwn(c,a)||!Object.hasOwn(c,b)) continue;
      const actual=c[b].x-c[a].x, reasons=[];
      if(!Number.isFinite(actual)) throw Error('Coupon center distance is too large.');
      if(Math.abs(actual-distance)>1e-9) reasons.push('relative centers differ');
      if([a,b].some(id=>Math.abs(c[id].slot_width-assembly[id].slot_width)>1e-9)) reasons.push('slot widths differ');
      if(reasons.length) mismatched.push({coupon:name,reasons}); else represented_by.push(name);
    }
    relations.push({pair:[a,b],signed_distance_mm:distance,represented_by,mismatched,status:represented_by.length?'nominally_represented':'unrepresented'});
  }
  return {relations,represented:relations.filter(r=>r.represented_by.length).length,total:relations.length};
}
export function missingPlans(assembly,report) {
  const plans={};
  for(const row of report.relations.filter(r=>r.status==='unrepresented')) {
    const start=Math.min(...row.pair.map(id=>assembly[id].x));
    const full=`Repair ${row.pair.join(' + ')}`;const base=full.length>50?full.slice(0,49)+'…':full; let key=base,n=2;while(Object.hasOwn(plans,key))key=`${base} (${n++})`;
    plans[key]=Object.fromEntries(row.pair.map(id=>[id,{x:assembly[id].x-start,slot_width:assembly[id].slot_width}]));
  }
  return plans;
}
export function readProject(value) {
  if(value.schema!==1 || value.units!=='mm') throw Error('Expected PrintFit schema 1, units mm.');
  compare(value.assembly,value.coupons); return structuredClone(value);
}
