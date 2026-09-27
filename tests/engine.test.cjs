const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'dist');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'cases.js'),'utf8')+';this.cases=caseLibrary;this.caseDetails=caseClinicalDetails;this.getBinding=evidenceBinding;',context);
vm.runInContext(fs.readFileSync(path.join(root,'engine.js'),'utf8'),context);
const E=context.LinghuEngine;
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;}
for(let c=0;c<6;c++) for(let s=0;s<5;s++) {
  for(const level of ['clerk','intern','resident']) {
    check(E.analyze(c,s,context.cases[c].stages[s][1],level).status==='pass',`case ${c+1} stage ${s+1} ${level} reference must progress`);
  }
  check(E.analyze(c,s,'').status==='empty','empty rejected');
  check(E.analyze(c,s,'今天天气很好').status==='offtrack','irrelevant text rejected');
}
check(E.analyze(0,0,'病程').status==='insufficient','partial answer needs more evidence');
check(E.analyze(0,0,'病程与发热','clerk').status==='pass','clerk threshold');
check(E.analyze(0,0,'病程与发热','resident').status==='insufficient','resident threshold');
check(E.analyze(0,0,'不问病程，不问发热，不问血栓').hits.length===0,'negation not counted');
check(E.analyze(0,4,'直接出院，不用监测血氧').status==='safety','explicit unsafe direction');
check(E.analyze(0,4,'不应直接出院，吸氧、超声和病因检查。').status==='pass','negated unsafe direction');
check(E.analyze(0,4,'超声与穿刺').status==='safety','omitted priority group');
const state=E.createSession(0,1000);
check(E.validSession(state,0),'fresh state valid');
check(!E.validSession({...state,stage:8},0),'bad stage rejected');
check(!E.validSession({...state,events:[{type:'answer',stage:0,at:2000}]},0),'missing answer result rejected');
check(E.metrics(state).score===0 && E.metrics(state).answers===0,'no fabricated initial metrics');
const r=E.analyze(0,0,context.cases[0].stages[0][1]);
state.events.push({type:'answer',at:2000,stage:0,text:'test',level:'clerk',result:r});
state.events.push({type:'answer',at:3000,stage:0,text:'test',level:'clerk',result:r});
state.events.push({type:'hint',at:4000,stage:0,level:'clerk',intensity:'light'});
state.passed[0]=true;
check(E.metrics(state).score===20,'repeated answers must not inflate coverage');
check(E.metrics(state).hints===1 && E.metrics(state).answers===2,'actual event counts');
const other=E.createSession(1);check(other.events.length===0 && !other.passed[0],'case sessions isolated');
check(context.caseDetails.length===6,'all six cases have detail cards');
for(let c=0;c<6;c++){
  const detail=context.caseDetails[c];
  check(Boolean(detail.chiefComplaint&&detail.history&&detail.exam&&detail.labs),'detail card has complaint, history, exam and laboratory data');
  check(['xray','ct','pathology'].every(key=>Boolean(detail.imageFindings[key])),'detail card has all three imaging slots');
  for(let s=0;s<5;s++){
    const binding=context.getBinding(c,s);
    check(binding.references.length===3,'each feedback binding has three source slots');
    check(binding.references.every(r=>r.id&&r.title&&r.locator&&r.status),'source binding fields complete');
  }
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check(new Set(ids).size===ids.length,'HTML IDs unique');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const dynamicIds=['traceToEvidence','downloadGuideSchema'];
for(const [,id] of app.matchAll(/\$\('([^']+)'\)/g))check(ids.includes(id)||dynamicIds.includes(id),`missing DOM ID ${id}`);
for(const [,ref] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g))check(fs.existsSync(path.join(root,ref.split('?')[0])),`missing asset ${ref}`);
check(!/prototype/i.test(html+app),'no obsolete prototype label');
for(const id of ['caseDetailDialog','teacherEvaluation','trajectoryStepper','reportDimensions','traceStudent','traceGuide'])check(ids.includes(id),`enhanced UI missing ${id}`);
console.log(`PASS: ${checks} checks; 6 cases × 5 stages × 3 levels, branching, metrics, isolation and page bindings.`);
