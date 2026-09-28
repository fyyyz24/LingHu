const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {root,sha,read,write}=require('./materials-lib.cjs');
const suites=['engine','clinical-experience','functional','materials'];
const results=suites.map(name=>{const p=cp.spawnSync(process.execPath,[`tests/${name}.test.cjs`],{cwd:root,encoding:'utf8',timeout:120000});return {suite:name,exit_code:p.status,output:p.stdout.trim(),error:(p.stderr||p.error?.message||'').trim()};});
const checkedFiles=['datasets/train.jsonl','datasets/validation.jsonl','datasets/test.jsonl','datasets/eval-prompts.jsonl','datasets/eval-reference.jsonl','datasets/split-manifest.json','datasets/assets-manifest.json','dist/examples/TEACHING-IMPORT-01-IMAGE.json'];
for(const dir of ['dist','tests','scripts'])for(const name of fs.readdirSync(path.join(root,dir))){if(/\.(?:js|cjs|html|css|py)$/.test(name))checkedFiles.push(dir+'/'+name);}
const ok=results.every(r=>r.exit_code===0);
write('submission/validation-report.json',{kind:'actual_structural_and_application_tests_not_model_evaluation',executed_at:new Date().toISOString(),node:process.version,platform:process.platform,status:ok?'passed':'failed',clinical_review:'pending',training_executed:false,model_metrics:null,results,validated_files:checkedFiles.map(file=>({file,sha256:sha(read(file))}))});
for(const r of results){console.log(r.output);if(r.error)console.error(r.error);}
if(!ok)process.exitCode=1;
