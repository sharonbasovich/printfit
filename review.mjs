// Review presentation only. Nominal comparison and coverage stay in core.mjs.
export function filterRelations(relations, filter='all') {
  if(filter==='attention') return relations.filter(r=>!r.represented_by.length || r.mismatched.length);
  if(filter==='missing') return relations.filter(r=>!r.represented_by.length);
  if(filter==='mismatches') return relations.filter(r=>r.mismatched.length);
  return relations;
}

export function inspectionDetails(assembly, coupon, pair) {
  if(!coupon || pair.length!==2 || pair.some(id=>!Object.hasOwn(assembly,id)||!Object.hasOwn(coupon,id))) return [];
  const [a,b]=pair;
  return [
    {label:`${a} → ${b} relative centers`, expected:assembly[b].x-assembly[a].x, actual:coupon[b].x-coupon[a].x},
    ...pair.map(id=>({label:`${id} slot width`, expected:assembly[id].slot_width, actual:coupon[id].slot_width}))
  ].map(d=>({...d,mismatch:Math.abs(d.actual-d.expected)>1e-9}));
}
