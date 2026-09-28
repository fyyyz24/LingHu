const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p).toString('utf8'));
const lines=p=>read(p).toString('utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
function write(p,value){const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n','utf8');}
function boot(){const ctx=vm.createContext({URL,Blob,console,document:{addEventListener(){}},window:{}});for(const f of ['cases.js','engine.js','medical-resources.js','clinical-experience.js','case-import.js','evidence-library.js'])vm.runInContext(read('dist/'+f).toString('utf8'),ctx,{filename:f});vm.runInContext('this.data={cases:caseLibrary,details:caseClinicalDetails,resources:caseResources,stages:stageNames,imports:CaseImport,evidence:EvidenceLibrary};',ctx);return ctx;}
module.exports={root,sha,read,json,lines,write,boot};
