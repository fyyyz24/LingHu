/* Local, schema-validated CaseBundle ingestion. No network or automated medical approval. */
const CaseImport = (() => {
  const KEY='linghu.caseBundles.v1', MAX_BYTES=2500000;
  let bundles=[], pending=null, storageBlocked=false;
  const string=(v,max=3000)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
  function https(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
  function validate(b, existing=bundles.map(x=>x.id)) {
    const errors=[], add=(ok,msg)=>{if(!ok)errors.push(msg);};
    if(!b||Array.isArray(b)||typeof b!=='object')return ['必须是一个 JSON 病例对象'];
    add(b.schemaVersion===1,'schemaVersion 必须为 1');
    add(string(b.id,64)&&/^[A-Za-z0-9_-]+$/.test(b.id),'id 请使用 1–64 位字母、数字、下划线或短横线');
    add(!existing.includes(b.id),'病例 id 已存在，请使用新 id，避免覆盖已有训练记录');
    for(const key of ['title','specialty'])add(string(b[key],120),`${key} 必填，最多 120 字`);
    add(b.provenance?.deidentified===true,'provenance.deidentified 必须为 true；须先人工脱敏');
    add(string(b.provenance?.source,500)&&string(b.provenance?.permission,500),'必须登记来源 source 与授权 permission');
    add(['pending','reviewed'].includes(b.review?.status),'review.status 仅支持 pending / reviewed');
    if(b.review?.status==='reviewed')add(string(b.review.reviewer,100)&&/^\d{4}-\d{2}-\d{2}$/.test(b.review.reviewedAt||''),'声明已审核时须填写审核人和 YYYY-MM-DD 日期');
    add(Number.isInteger(b.patient?.age)&&b.patient.age>=0&&b.patient.age<=120,'patient.age 必须为 0–120 岁整数');
    add(['男','女','未说明'].includes(b.patient?.sex),'patient.sex 使用 男 / 女 / 未说明');
    for(const key of ['chiefComplaint','history','exam','labs'])add(string(b.patient?.[key]),`patient.${key} 必填（未知检查填写尚未获得，不得编造）`);
    const forbidden=/(?:^|_)(?:name|patientName|phone|email|address|idNumber|recordNumber|hospital|身份证|姓名|电话|住址|病案号)(?:$|_)/i;
    function scan(v,path=''){if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>{if(['__proto__','constructor','prototype'].includes(k)||forbidden.test(k))errors.push(`不允许身份字段或保留键：${path}${k}`);scan(x,`${path}${k}.`);});}
    scan(b);
    const refs=Array.isArray(b.references)?b.references:[];
    add(refs.length>0&&refs.length<=20,'references 需有 1–20 条可追溯来源');
    const refIds=new Set();refs.forEach((r,i)=>{add(string(r?.id,64)&&!refIds.has(r.id),`来源 ${i+1} id 缺失或重复`);refIds.add(r?.id);for(const k of ['title','publisher','section'])add(string(r?.[k],500),`来源 ${i+1} ${k} 必填`);add(https(r?.url),`来源 ${i+1} 必须使用无凭据 HTTPS 原文链接`);});
    add(Array.isArray(b.stages)&&b.stages.length===5,'stages 必须包含五个阶段');
    if(Array.isArray(b.stages))b.stages.forEach((s,i)=>{
      add(s?.order===i+1,`阶段 ${i+1} order 应为 ${i+1}`);
      for(const k of ['question','referenceAnswer'])add(string(s?.[k]),`阶段 ${i+1} ${k} 必填`);
      add(Array.isArray(s?.releasedFacts)&&s.releasedFacts.length>0&&s.releasedFacts.every(x=>string(x)),`阶段 ${i+1} releasedFacts 需包含文字事实`);
      add(Array.isArray(s?.requiredConcepts)&&s.requiredConcepts.length===3&&new Set(s.requiredConcepts).size===3&&s.requiredConcepts.every(x=>string(x,60)&&!x.includes('|')),`阶段 ${i+1} 需填写三个不重复 requiredConcepts（末阶段第一个为安全优先要点）`);
      for(const level of ['clerk','intern','resident'])add(string(s?.hintLevels?.[level]),`阶段 ${i+1} 缺少 ${level} 提示`);
      add(Array.isArray(s?.evidenceIds)&&s.evidenceIds.length>0&&s.evidenceIds.every(id=>refIds.has(id)),`阶段 ${i+1} evidenceIds 必须指向已登记来源`);
      for(const [key,aliases] of Object.entries(s?.acceptedAliases||{}))add(s.requiredConcepts?.includes(key)&&Array.isArray(aliases)&&aliases.length<=12&&aliases.every(a=>string(a,60)&&!a.includes('|')),`阶段 ${i+1} acceptedAliases 格式错误`);
      add(!s?.dangerousOmissions||Array.isArray(s.dangerousOmissions)&&s.dangerousOmissions.every(x=>string(x,200)),`阶段 ${i+1} dangerousOmissions 需为文本数组`);
    });
    add(Array.isArray(b.assets)&&b.assets.length<=6,'assets 必须为数组，最多六张图片（可为空）');
    if(Array.isArray(b.assets))b.assets.forEach((a,i)=>{
      add(typeof a?.dataUrl==='string'&&a.dataUrl.length<=1000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(a.dataUrl),`图 ${i+1} 仅支持小于 1 MB 的 PNG/JPEG/WebP base64，禁止 SVG 和远程自动加载`);
      for(const k of ['label','caption','author','license'])add(string(a?.[k],500),`图 ${i+1} ${k} 必填`);
      add(https(a?.sourceUrl)&&https(a?.licenseUrl),`图 ${i+1} 需填写来源与许可 HTTPS 链接`);
    });
    return [...new Set(errors)];
  }
  function apply(b) {
    const index=caseLibrary.length, p=b.patient;
    const groups=b.stages.map(s=>s.requiredConcepts.map(label=>[label,...(s.acceptedAliases?.[label]||[])]));
    LinghuEngine.registerCase(index,groups);
    caseLibrary.push({code:`IMPORT ${b.id}`,title:b.title,specialty:b.specialty,tags:b.specialty+' 导入',patient:`${p.age} 岁${p.sex}性`.replace('未说明性','（性别未说明）'),summary:p.chiefComplaint,vitals:[],differentials:[],safety:b.stages[4].dangerousOmissions?.join('；')||'处置前复核安全优先要点。',evidence:b.stages[2].releasedFacts,source:b.provenance.source,sourcePage:'用户导入，医学适用性待独立复核',hasImage:b.assets.length>0,review:b.review,importedId:b.id,stageEvidenceIds:b.stages.map(s=>s.evidenceIds),stageFacts:b.stages.map(s=>s.releasedFacts),hintLevels:b.stages.map(s=>s.hintLevels),stages:b.stages.map(s=>[s.question,s.referenceAnswer,'请复核证据联系。',s.hintLevels.intern]),advice:[]});
    caseClinicalDetails.push({chiefComplaint:p.chiefComplaint,history:p.history,exam:p.exam,labs:p.labs,imageFindings:{xray:'按导入资料展示',ct:'按导入资料展示',pathology:'按导入资料展示'}});
    caseResources.push({context:`导入来源：${b.provenance.source}。授权声明：${b.provenance.permission}。审核状态为导入者声明，平台未独立验证。`,points:['按已登记资料学习，不把缺失检查补写为真实结果。','病例仅保存在当前浏览器，清理站点数据会丢失；请保留 JSON 源文件。'],references:b.references,assets:b.assets.map(a=>({...a,src:a.dataUrl,alt:a.caption,role:'用户导入 · 来源及许可为导入声明',limit:'医学适用性与隐私脱敏需人工核验。'}))});
    return index;
  }
  function commit(b, storage=localStorage){if(storageBlocked)throw Error('原有病例存档异常，为避免覆盖已停止写入，请先备份并修复站点存档');const errors=validate(b);if(errors.length)throw new Error(errors.join('；'));const next=[...bundles,b], raw=JSON.stringify(next);if(next.length>20||new Blob([raw]).size>MAX_BYTES)throw new Error('最多导入 20 例，合计 2.5 MB，请减少图片大小');storage.setItem(KEY,raw);const index=apply(b);bundles=next;return index;}
  function restore(storage=localStorage){try{const raw=storage.getItem(KEY);if(!raw)return;const saved=JSON.parse(raw);if(!Array.isArray(saved)||saved.length>20||new Blob([raw]).size>MAX_BYTES)throw Error('病例存档结构或大小异常');const ids=[];for(const b of saved){const errors=validate(b,ids);if(errors.length)throw Error(errors[0]);ids.push(b.id);}saved.forEach(apply);bundles=saved;}catch(error){storageBlocked=true;throw error;}}
  function sample(){const c=caseLibrary[0],d=caseClinicalDetails[0];return {schemaVersion:1,id:'TEACHING-IMPORT-01',title:'导入示例 · 呼吸困难教学练习',specialty:'呼吸系统',review:{status:'pending',reviewer:'',reviewedAt:''},provenance:{source:'灵葫内置教学扩写；非真实病历',permission:'用于本地教学流程测试',deidentified:true},patient:{age:63,sex:'男',chiefComplaint:d.chiefComplaint,history:d.history,exam:d.exam,labs:d.labs},stages:stageNames.map((title,i)=>({order:i+1,title,releasedFacts:[i===0?d.chiefComplaint:i===1?d.exam:i===2?d.labs:'请整合已开放资料。'],question:c.stages[i][0],referenceAnswer:c.stages[i][1],requiredConcepts:LinghuEngine.getGroups(0,i).map(g=>g.label),acceptedAliases:Object.fromEntries(LinghuEngine.getGroups(0,i).map(g=>[g.label,g.aliases])),dangerousOmissions:i===4?['先评估病情严重度']:[],hintLevels:{clerk:'请按要点逐项解释。',intern:c.stages[i][3],resident:'如果判断不成立，哪些证据需要重新核对？'},evidenceIds:['BTS2023']})),assets:[],references:[{id:'BTS2023',title:'BTS Guideline for Pleural Disease',publisher:'British Thoracic Society',section:'Undiagnosed unilateral pleural effusion',url:'https://www.brit-thoracic.org.uk/clinical-resources/guidelines/pleural-disease/',version:'2023'}]};}
  function initUI(){
    const form=document.getElementById('caseImportForm'), out=document.getElementById('importPreview'), confirm=document.getElementById('confirmCaseImport');
    const clear=()=>{pending=null;confirm.disabled=true;out.textContent='尚未校验。病例只写入本机浏览器，不上传患者资料。';};
    form.addEventListener('input',clear);
    document.getElementById('caseImportFile').onchange=async e=>{clear();const f=e.target.files[0];if(!f)return;if(f.size>MAX_BYTES){out.textContent='文件过大：请选择不超过 2.5 MB 的 JSON';return;}const text=await f.text();if(e.target.files[0]!==f)return;document.getElementById('caseImportText').value=text;};
    document.getElementById('loadImportExample').onclick=()=>{clear();document.getElementById('caseImportText').value=JSON.stringify(sample(),null,2);};
    form.onsubmit=e=>{e.preventDefault();clear();try{if(recording)throw Error('请先退出录屏模式，再导入持久病例');if(!document.getElementById('confirmDeidentified').checked)throw Error('请确认内容已脱敏且拥有使用权限');const raw=document.getElementById('caseImportText').value;if(new Blob([raw]).size>MAX_BYTES)throw Error('JSON 超过 2.5 MB');const b=JSON.parse(raw),errors=validate(b);if(errors.length){out.textContent=errors.join('\n');return;}pending=b;out.textContent=`结构校验通过（不是医学审核）\n${b.title}\n${b.patient.age} 岁 · ${b.specialty}\n5 阶段 · ${b.references.length} 条来源 · ${b.assets.length} 张图\n审核声明：${b.review.status==='reviewed'?'导入者声明已审核，平台未独立验证':'待临床教师审核'}\n确认后在病例库与训练选择器中可见。`;confirm.disabled=false;}catch(err){out.textContent=err.message;}};
    confirm.onclick=()=>{if(!pending)return;try{if(recording)throw Error('请先退出录屏模式');const index=commit(pending);clear();refreshCaseSelectors();renderCaseCards();selectCase(index);navigate('cases');showToast('病例已入库并保存在本机；可查看详情和进入训练');}catch(err){out.textContent=`未导入：${err.message}。请保留原 JSON 文件。`;}};
  }
  return {validate,commit,restore,sample,initUI,https};
})();
