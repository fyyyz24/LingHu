/* Curated bibliographic index: source access is separate from medical applicability review. */
const EvidenceLibrary = (() => {
  const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const curated=[
    {version:'2023',section:'Undiagnosed unilateral pleural effusion；附录 B1 影像诊断、B2 影像引导',summary:'用于定位单侧胸腔积液的检查与处理依据。具体操作须结合适应证和临床审核。'},
    {version:'2020',url:'https://pubmed.ncbi.nlm.nih.gov/32314058/',section:'Abstract；全文中的 CT 影像特征与检查适用人群',doi:'10.1007/s00330-020-06865-y',summary:'介绍 COVID-19 影像表现与 CT 的使用场景。作为形态教学资料，不代表当前治疗指南，也不能单凭 CT 确定病原。'},
    {version:'2026-07-15（网页复核日期）',section:'What are the limitations of Cardiac CT for Calcium Scoring?',summary:'钙化评分描述已钙化斑块，不反映全部软斑块，也不直接显示管腔是否狭窄。'},
    {version:'2024-11-07',section:'Diagnosis：Abdominal CT、Colonoscopy、Stool analysis',summary:'诊断部分列出腹部 CT、结肠镜和粪便检查。仅作肠壁异常的鉴别学习资料，不据此确诊当前患者。'},
    {version:'网页资料（动态更新）',url:'https://www.ehlers-danlos.com/genetics-and-inheritance/',title:'Genetics and Inheritance of EDS and HSD',section:'Genetic testing；EDS 亚型与遗传方式',summary:'除 hEDS 外，符合相应临床标准的 EDS 类型通常需遗传检测确认；检测应由医学专业人员安排和解释。'},
    {version:'CG109',section:'1.1 Initial assessment；1.1.1.2 事件经过；1.1.2 病史与检查',summary:'定位短暂意识丧失的事件采集与初始评估。持续无反应伴呼吸异常不能按普通晕厥处理。'}
  ];
  function all(){
    const entries=[{id:'hulu-paper',type:'foundation',title:'Hulu-Med: A Transparent Generalist Model towards Holistic Medical Vision-Language Understanding',publisher:'Jiang et al. · arXiv',version:'2510.08668v2 · 2025-11-05',url:'https://arxiv.org/abs/2510.08668v2',doi:'10.48550/arXiv.2510.08668',section:'Abstract；Methods；Extended Figures（页码以所选版本为准）',summary:'基础模型的统一多模态架构、公开训练数据和综合评测依据。不是某条临床反馈的诊疗证据。',status:'公开原文入口',caseIndex:null},
      {id:'hulu-repo',type:'foundation',title:'ZJUI-AI4H / Hulu-Med',publisher:'ZJU AI4H · GitHub',version:'在线仓库（持续更新）',url:'https://github.com/ZJUI-AI4H/Hulu-Med',section:'README / Inference / MedUniEval / Citation',summary:'模型资源、推理示例与评测代码入口。与灵葫本地规则引擎的结果区分展示。',status:'官方代码入口',caseIndex:null}];
    caseResources.forEach((r,i)=>{
      r.references.forEach((ref,j)=>entries.push({...ref,...(i<6&&j===0?curated[i]:{}),id:`case-${i}-ref-${j}`,originalId:ref.id,type:'clinical',caseIndex:i,status:i<6?'公开学习资料 · 医学适用性待复核':'导入来源 · 未独立核验',version:(i<6&&j===0?curated[i].version:ref.version)||'来源网页，版本未提供',summary:(i<6&&j===0?curated[i].summary:ref.summary)||'依照来源页与导入的章节信息核验；不自动等同于本病例诊断依据。'}));
      r.assets.forEach((a,j)=>entries.push({id:`case-${i}-image-${j}`,type:'image',caseIndex:i,title:a.label+' · 图像来源与许可',publisher:a.author,version:a.license,url:a.sourceUrl,section:a.caption,summary:a.limit,sourceNote:a.sourceNote,status:a.role,image:a.src,licenseUrl:a.licenseUrl}));
    });return entries;
  }
  function forStage(index,stage){const c=caseLibrary[index],ids=c.stageEvidenceIds?.[stage];return all().filter(x=>x.type==='clinical'&&x.caseIndex===index&&(!ids||ids.includes(x.originalId)));}
  function bindingHtml(index,stage,snapshot){const refs=snapshot||forStage(index,stage);return refs.map(r=>`<article class="source-binding"><small>${h(r.id)} · ${h(r.version)}</small><b>${h(r.title)}</b><p>定位：${h(r.section)}</p><a href="${h(r.url)}" target="_blank" rel="noopener noreferrer">打开原文 ↗</a><button type="button" class="text-button" data-evidence-id="${h(r.id)}">在证据面板查看</button></article>`).join('')+`<p class="verification-note">以上是本阶段关联的公开文献索引，不代表已完成逐句医学论证；未核验的教材章次不再当作证据列出。</p>`;}
  let currentId='hulu-paper';
  function mount(preferred){
    const picker=document.getElementById('evidenceCase');picker.innerHTML='<option value="all">全部病例</option>'+caseLibrary.map((c,i)=>`<option value="${i}">${h(c.code)} · ${h(c.title)}</option>`).join('');picker.value=String(activeCaseIndex);
    document.getElementById('evidenceQuery').value='';document.getElementById('evidenceType').value='all';
    const requested=preferred==='paper'?'hulu-paper':preferred==='repo'?'hulu-repo':preferred;
    currentId=all().some(r=>r.id===requested)?requested:forStage(activeCaseIndex,session().stage)[0]?.id||'hulu-paper';
    const selected=all().find(r=>r.id===currentId);if(selected?.caseIndex!=null)picker.value=String(selected.caseIndex);
    for(const id of ['evidenceQuery','evidenceType','evidenceCase'])document.getElementById(id).oninput=render;
    render();
  }
  function render(){const q=document.getElementById('evidenceQuery').value.trim().toLowerCase(),type=document.getElementById('evidenceType').value,index=document.getElementById('evidenceCase').value;
    const list=all().filter(r=>(index==='all'||r.caseIndex==null||String(r.caseIndex)===index)&&(type==='all'||r.type===type)&&`${r.title} ${r.publisher} ${r.section} ${r.doi||''}`.toLowerCase().includes(q));
    if(!list.some(r=>r.id===currentId))currentId=list[0]?.id;
    document.getElementById('sourceCatalog').innerHTML=list.map(r=>`<button class="source-item ${r.id===currentId?'active':''}" data-document="${h(r.id)}"><span>${r.type==='foundation'?'P':r.type==='image'?'I':'C'}</span><div><b>${h(r.title)}</b><small>${h(r.version)}</small></div></button>`).join('')||'<p class="empty-state">没有匹配来源，请调整关键词。</p>';
    document.querySelectorAll('[data-document]').forEach(b=>b.onclick=()=>{currentId=b.dataset.document;render();});
    detail(list.find(r=>r.id===currentId));
  }
  function detail(r){const el=document.getElementById('sourceDetail');if(!r){el.innerHTML='<p class="empty-state">未找到来源</p>';return;}
    const citation=`${r.publisher}. ${r.title}. ${r.version}. ${r.section}. ${r.url||'本地图片来源：'+r.sourceNote}${r.doi?' DOI: '+r.doi:''}`;
    el.innerHTML=`<span class="source-tag">${h(r.status)}</span><h2>${h(r.title)}</h2><p>${h(r.publisher)} · ${h(r.version)}</p><div class="evidence-actions">${r.url?`<a class="primary-button" href="${h(r.url)}" target="_blank" rel="noopener noreferrer">打开原文 ↗</a>`:'<span>本地上传图片 · 无公开原文链接</span>'}${r.doi?`<a class="secondary-button" href="https://doi.org/${h(r.doi)}" target="_blank" rel="noopener noreferrer">DOI ↗</a>`:''}<button class="secondary-button" id="exportCitation">导出引用</button></div><div class="evidence-location"><span>原文定位 / 来源说明</span><h3>${h(r.section)}</h3><p>${h(r.summary)}</p>${r.sourceNote?`<p>${h(r.sourceNote)}</p>`:''}</div><div class="evidence-citation"><span>引用信息</span><p>${h(citation)}</p></div>${r.image?`<figure class="document-image"><img src="${h(r.image)}" alt="${h(r.section)}"><figcaption>${h(r.publisher)} · ${r.licenseUrl?`<a href="${h(r.licenseUrl)}" target="_blank" rel="noopener noreferrer">查看许可</a>`:h(r.version)}</figcaption></figure>`:''}<p class="modal-note">图片及其授权声明需人工核验。本地图片不自动上传；外部原文仅在点击链接时打开。</p>`;
    document.getElementById('exportCitation').onclick=()=>{const blob=new Blob([citation],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`灵葫-引用-${r.id}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }
  function open(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());navigate('evidence');mount(id);const r=all().find(x=>x.id===id);if(r){session().events.push({type:'evidence',at:Date.now(),stage:session().stage,sourceId:r.id});persist();renderReport();}}
  return {all,forStage,bindingHtml,mount,open};
})();
