const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','dist');let checks=0;
const check=(c,m)=>{assert.ok(c,m);checks++;};
function boot(){const c=vm.createContext({URL,Blob,console,document:{addEventListener(){}},window:{}});for(const f of ['cases.js','engine.js','medical-resources.js','clinical-experience.js','case-import.js','evidence-library.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});vm.runInContext('this.I=CaseImport;this.E=EvidenceLibrary;this.X=ClinicalExperience;this.cases=caseLibrary;this.resources=caseResources',c);return c;}
const c=boot(),clone=v=>JSON.parse(JSON.stringify(v)),sample=clone(c.I.sample());
check(c.I.validate(sample).length===0,'downloadable sample validates');
for(const mutate of [b=>b.patient.age=-1,b=>b.patient.name='private',b=>b.provenance.deidentified=false,b=>b.stages.pop(),b=>b.stages[0].evidenceIds=['missing'],b=>b.references[0].url='javascript:alert(1)',b=>b.references[0].url='https://user:secret@example.com',b=>b.stages[0].requiredConcepts=['a','a','c'],b=>b.stages[0].acceptedAliases.bad=['x'],b=>b.review={status:'reviewed'},b=>b.assets=[{dataUrl:'data:image/svg+xml;base64,PHN2Zz4='}]]){const b=clone(sample);mutate(b);check(c.I.validate(b).length>0,'invalid payload rejected');}
let raw;const storage={setItem(k,v){raw=v;},getItem(){return raw||null;}};
assert.throws(()=>c.I.commit(sample,{setItem(){throw Error('quota')}}));check(c.cases.length===6,'storage failure has no partial registration');
const index=c.I.commit(sample,storage);check(index===6&&c.cases.length===7,'successful import becomes case 7');
check(c.I.validate(sample).length>0,'duplicate id rejected');
check(c.X.evidence(6,2).visual.includes('未导入影像'),'no fabricated imagery for text-only import');
for(let stage=0;stage<5;stage++){check(c.LinghuEngine.analyze(index,stage,sample.stages[stage].referenceAnswer,'resident').status==='pass','imported rules drive training');check(c.E.forStage(index,stage).length===1,'stage citations resolve imported ids');}
const s=c.LinghuEngine.createSession(index);check(c.LinghuEngine.metrics(s).score===0,'imported report empty until real events');
check(c.E.all().every(x=>x.url.startsWith('https://')),'all source links HTTPS');
check(c.E.all().some(x=>x.doi==='10.48550/arXiv.2510.08668'),'Hulu paper DOI registered');
const reload=boot();reload.I.restore(storage);check(reload.cases.length===7,'imports restore after reload');check(reload.cases[6].importedId===sample.id,'stable case identity');
check(reload.E.forStage(6,0)[0].url===sample.references[0].url,'imported citation survives reload');
const corrupt=boot();assert.throws(()=>corrupt.I.restore({getItem:()=>'{broken'}));assert.throws(()=>corrupt.I.commit(sample,storage));check(corrupt.cases.length===6,'corrupt saved import never overwritten silently');
const hostile=clone(sample);hostile.id='HOSTILE';hostile.title='<img src=x onerror=alert(1)>';hostile.references[0].title='<script>bad</script>';c.I.commit(hostile,storage);check(c.E.bindingHtml(7,0).includes('&lt;script&gt;'),'imported citation markup escaped');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');check(!html.includes('view-evaluation')&&!html.includes('data-view="evaluation"'),'decorative evaluation module removed');
check(html.includes('processingPanel')&&html.includes('confirmCaseImport'),'loading and import UI bound');
check(!/fetch\(|XMLHttpRequest|WebSocket/.test(fs.readFileSync(path.join(root,'processing.js'),'utf8')),'no hidden transmission of clinical answers');
// Fake clock verifies cancellation and duplicate-submission behavior without a browser.
(async()=>{
  const callbacks=new Map(),panel={hidden:true,setAttribute(){},querySelector(){return {textContent:''}},querySelectorAll(){return []}},control={disabled:false};let timer=0,commits=0;
  const pc=vm.createContext({console,document:{querySelectorAll:()=>[control],getElementById:()=>panel},window:{matchMedia:()=>({matches:false})},setTimeout:f=>{callbacks.set(++timer,f);return timer;},clearTimeout:id=>callbacks.delete(id),activeCaseIndex:0,stageNames:['问诊'],activeCase:()=>({code:'TEST'}),Engine:{analyze:()=>({hits:[],label:'待补'})},EvidenceLibrary:{forStage:()=>[]},showToast(){},commitReasoning(){commits++;return{ok:true}}});
  vm.runInContext('const state={stage:0,level:"clerk",passed:[false]};function session(){return state;}',pc);vm.runInContext(fs.readFileSync(path.join(root,'processing.js'),'utf8')+';this.P=TeachingProcess;',pc);
  const pending=pc.P.submit('test');check(pc.P.isBusy()&&control.disabled,'processing locks input');check((await pc.P.submit('again')).reason==='busy','duplicate blocked');pc.P.cancel();check((await pending).reason==='cancelled'&&commits===0&&!control.disabled,'cancel restores controls without saving');
  const successful=pc.P.submit('test');for(let i=0;i<4;i++){const [id,f]=callbacks.entries().next().value;callbacks.delete(id);f();await Promise.resolve();}check((await successful).ok&&commits===1&&!control.disabled,'completed pipeline saves exactly once');
  console.log(`PASS: ${checks} import, persistence, evidence, safety and async pipeline checks.`);
})().catch(e=>{console.error(e);process.exitCode=1});
