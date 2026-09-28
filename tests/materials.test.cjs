const assert=require('node:assert/strict');
const {sha,read,json,lines,boot}=require('../scripts/materials-lib.cjs');
let checks=0;const check=(c,m)=>{assert.ok(c,m);checks++;};
const sets={},ids=new Set(),caseSplit=new Map(),prompts=lines('datasets/eval-prompts.jsonl'),refs=lines('datasets/eval-reference.jsonl');
for(const [split,n] of Object.entries({train:45,validation:15,test:30})){
  sets[split]=lines(`datasets/${split}.jsonl`);check(sets[split].length===n,`${split} count`);
  for(const r of sets[split]){
    check(!ids.has(r.id),'unique id');ids.add(r.id);
    check(!caseSplit.has(r.case_id)||caseSplit.get(r.case_id)===split,'case-disjoint split');caseSplit.set(r.case_id,split);
    check(r.split===split&&r.clinical_review==='pending'&&r.data_origin==='teaching_adaptation','truthful provenance');
    check(r.messages.length===3&&r.messages.map(x=>x.role).join(',')==='system,user,assistant','SFT roles');
    check(r.references.length>0&&r.references.every(x=>x.url.startsWith('https://')),'source URLs');
    check(r.messages.every(m=>m.content.trim().length>0)&&!JSON.stringify(r).includes('data:image/'),'text-only, nonempty');
    const serialized=JSON.stringify({facts:r.facts_available,messages:r.messages});
    check(!/(?:^|\D)(?:1[3-9]\d{9}|\d{17}[\dXx])(?:\D|$)/.test(serialized),'no common phone/id patterns');
    const forbidden=new Set(['patientName','name','phone','email','address','idNumber','recordNumber','hospital','姓名','身份证','病案号']);
    const scan=v=>{if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){assert.ok(!forbidden.has(k),'no identity fields');scan(x);}};scan(r);checks++;
    check(json('datasets/split-manifest.json').splits[split].sha256===sha(read(`datasets/${split}.jsonl`)),'split checksum');
  }
}
check(caseSplit.size===6&&prompts.length===30&&refs.length===30,'six cases and eval count');
prompts.forEach((p,i)=>{check(p.id===sets.test[i].id&&refs[i].id===p.id,'eval alignment');check(p.messages.length===2&&p.messages.every(m=>m.role!=='assistant')&&!('target' in p),'reference answer removed');assert.deepEqual(p.messages,sets.test[i].messages.slice(0,2));checks++;});
for(const a of json('datasets/assets-manifest.json').assets)check(sha(read(a.file))===a.sha256&&read(a.file).length===a.bytes&&!a.training_pair,'asset hash and role');
const b=json('dist/examples/TEACHING-IMPORT-01-IMAGE.json'),c=boot(),I=c.data.imports;
check(I.validate(b).length===0,'image bundle validates');
check(b.assets.length===1&&b.id==='TEACHING-IMPORT-01-IMAGE','new image example');
check(sha(Buffer.from(b.assets[0].dataUrl.split(',')[1],'base64'))===sha(read('dist/assets/references/pleural-effusion.png')),'original image bytes unchanged');
check(read('dist/examples/TEACHING-IMPORT-01-IMAGE.json').length<2500000,'bundle fits import cap');
let saved;const storage={getItem(){return saved||null},setItem(k,v){saved=v}};
const i=I.commit(b,storage);check(i===6&&c.data.cases[i].hasImage,'visible imported case with image');
const restored=boot();restored.data.imports.restore(storage);check(restored.data.cases[6].importedId===b.id&&restored.data.resources[6].assets[0].src===b.assets[0].dataUrl,'reload restores image');
check(restored.data.evidence.forStage(6,2).length===1,'import source available');
for(let s=0;s<5;s++)check(restored.LinghuEngine.analyze(6,s,b.stages[s].referenceAnswer,'resident').status==='pass','image example training references');
const giant=JSON.parse(JSON.stringify(b));giant.id='TOO-BIG';giant.assets[0].dataUrl='data:image/png;base64,'+'A'.repeat(1500000);check(I.validate(giant).length>0,'image length cap enforced');
I.commit({...b,id:'IMAGE-2'},storage);
assert.throws(()=>I.commit({...b,id:'IMAGE-3'},storage),/2.5 MB/);checks++;
console.log(`PASS: ${checks} materials, split isolation, image import and provenance checks.`);
