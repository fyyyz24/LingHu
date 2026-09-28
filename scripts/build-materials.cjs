/* Deterministic export of existing teaching content, not clinical-data collection or training. */
const fs=require('node:fs'),path=require('node:path');
const {root,sha,read,write,boot}=require('./materials-lib.cjs');
const {data:d}=boot(),levels={clerk:'见习',intern:'实习',resident:'住培'};
const splitFor=i=>i<3?'train':i===3?'validation':'test';
const rows={train:[],validation:[],test:[]};
d.cases.forEach((c,i)=>{
  const detail=d.details[i],split=splitFor(i);
  d.stages.forEach((stage,s)=>{
    const facts=[detail.chiefComplaint,detail.history,...(s>=1?[detail.exam]:[]),...(s>=2?[detail.labs]:[])];
    for(const [level,label] of Object.entries(levels)){
      const target=level==='clerk'?`请先按框架整理：${c.stages[s][3]}\n${c.stages[s][0]}`:level==='intern'?`请结合已有证据解释关键步骤。${c.stages[s][0]}\n哪些信息仍需补充？`:`${c.stages[s][0]}\n如果当前判断不成立，你会优先复核哪些证据和风险？`;
      rows[split].push({id:`${c.code.replace(' ','-')}-S${s+1}-${level}`,case_id:c.code,split,stage:s+1,stage_name:stage,level,data_origin:'teaching_adaptation',clinical_review:'pending',rights_status:'project_owner_confirmation_pending',facts_available:facts,messages:[{role:'system',content:'你是临床教学导师。按学习层级提出启发式问题；仅使用已给出的教学信息，不编造检查或文献，不替代医生诊疗，不输出隐藏思维链。'},{role:'user',content:`学习层级：${label}\n阶段：${stage}\n教学资料：\n${facts.join('\n')}\n请提出当前阶段的启发式追问，不直接给出最终诊断。`},{role:'assistant',content:target}],source:{file:'dist/cases.js',case_index:i,task_reference:c.source,note:'任务形式参考不等于原始病例或数据集授权；目标来自本地教学编排。'},references:d.evidence.forStage(i,s).map(r=>({title:r.title,url:r.url,section:r.section,verification:'clinical_applicability_pending'}))});
    }
  });
});
for(const [split,r] of Object.entries(rows))write(`datasets/${split}.jsonl`,r.map(x=>JSON.stringify(x)).join('\n')+'\n');
write('datasets/eval-prompts.jsonl',rows.test.map(r=>JSON.stringify({id:r.id,case_id:r.case_id,stage:r.stage,level:r.level,messages:r.messages.slice(0,2)})).join('\n')+'\n');
write('datasets/eval-reference.jsonl',rows.test.map(r=>JSON.stringify({id:r.id,target:r.messages[2].content,clinical_review:'pending'})).join('\n')+'\n');
write('datasets/split-manifest.json',{version:'teaching-seed-v1',unit:'case',patient_records:0,total_tasks:90,review:'pending',model_training_executed:false,splits:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,{cases:[...new Set(v.map(x=>x.case_id))],tasks:v.length,sha256:sha(read(`datasets/${k}.jsonl`))}]))});
const assets=d.resources.flatMap((r,i)=>r.assets.map(a=>{const file='dist/'+a.src.replace(/^\.\//,'');return {case_id:d.cases[i].code,file,sha256:sha(read(file)),bytes:read(file).length,author:a.author,license:a.license,license_url:a.licenseUrl,source_url:a.sourceUrl,role:a.role,caption:a.caption,limit:a.limit,changes:'本项目未修改图像像素；上游裁切版本按作者字段说明。',training_pair:false};}));
assets.push({file:'dist/assets/linghu-logo.png',sha256:sha(read('dist/assets/linghu-logo.png')),bytes:read('dist/assets/linghu-logo.png').length,author:'用户提供',license:'项目方确认权利；不为第三方授予许可',role:'项目品牌',training_pair:false});
assets.push({file:'dist/assets/hulu-med-page-52.png',sha256:sha(read('dist/assets/hulu-med-page-52.png')),bytes:read('dist/assets/hulu-med-page-52.png').length,author:'Hulu-Med 论文作者',source_url:'https://arxiv.org/abs/2510.08668',license_url:'https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html',license:'arXiv 非独占分发许可仅授予 arXiv；不等于允许本项目任意再分发。截图及其中第三方图像的使用边界待项目方核验，不纳入训练数据。',role:'既有应用引用截图，保留来源待审',training_pair:false});
write('datasets/assets-manifest.json',{assets});
write('submission/THIRD_PARTY_NOTICES.md','# 素材来源与许可\n\n请随图片分发保留此文件。公开参考影像不是教学患者原始检查，不作为配对训练图。项目不复制指南全文；署名和许可证不能代替医学适用性及隐私审核。\n\n'+assets.map(a=>`## ${a.file}\n\n- 作者：${a.author}\n- 许可：${a.license}\n- 来源：${a.source_url||'用户指定本地文件'}\n- 许可原文：${a.license_url||'待项目方确认；不得视为开放许可'}\n- 用途：${a.role}\n- 说明：${a.limit||'权利状态按以上记录；不作为临床配对数据。'}\n- 更改：${a.changes||'既有资产原样保留。'}\n- SHA-256：\`${a.sha256}\`\n`).join('\n'));
const bundle=JSON.parse(JSON.stringify(d.imports.sample())),asset=d.resources[0].assets[0];
bundle.id='TEACHING-IMPORT-01-IMAGE';bundle.title='呼吸困难教学练习 · 含胸片参考';
bundle.provenance.permission='教学文字用于本地流程测试；参考胸片 James Heilman, MD，CC BY-SA 3.0，须保留署名与许可。非真实患者原片。';
bundle.assets=[{label:'胸片 · 同病种参考',caption:asset.caption+' 非本教学患者原片，不据图确定积液量或病因。',author:asset.author,license:asset.license,sourceUrl:asset.sourceUrl,licenseUrl:asset.licenseUrl,dataUrl:'data:image/png;base64,'+read('dist/assets/references/pleural-effusion.png').toString('base64')}];
// The existing reference answer overstates volume; do not export it as confirmed fact.
bundle.stages[3].referenceAnswer='考虑右侧胸腔积液，积液量与性质尚待确认；鉴别肺不张、肺实变，并考虑恶性积液与脓胸等病因。';
if(d.imports.validate(bundle).length)throw Error(d.imports.validate(bundle).join(';'));
write('dist/examples/TEACHING-IMPORT-01-IMAGE.json',bundle);
const csv=(file,header,records)=>{if(!fs.existsSync(path.join(root,file)))write(file,'\ufeff'+[header,...records].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n');};
csv('submission/CLINICAL_REVIEW.csv',['case_id','title','clinical_status','rights_status','privacy_status','reviewer','reviewed_at','comments'],d.cases.map(c=>[c.code,c.title,'pending','pending','pending','','','']));
csv('submission/MODEL_EVALUATION.csv',['id','model_revision','adapter_sha256','raw_output_path','logic_0_2','safety_0_2','evidence_0_2','level_match_0_2','reviewer','reviewed_at','comments'],rows.test.flatMap(r=>['base','adapter'].map(model=>[r.id,model,'','','','','','','','',''])));
console.log('Built 45 train / 15 validation / 30 test tasks; 1 original-image import bundle. No model training performed.');
