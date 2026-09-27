'use strict';
function renderPipeline(index){const item=pipelineDetails[index];document.querySelectorAll(".pipeline-step").forEach((el,i)=>el.classList.toggle("active",i===index));document.getElementById("stepDetail").innerHTML=`<header><div><span>PIPELINE STEP</span><h3>${item.title}</h3></div><b>${item.no}</b></header><div class="step-flow"><div class="data-box"><span>输入</span><h4>${item.input}</h4><ul>${item.rules.map(r=>`<li>${r}</li>`).join("")}</ul></div><div class="step-arrow">→</div><div class="data-box"><span>输出</span><h4>${item.output}</h4><p>${item.note}</p></div></div>`}
function renderAdaptation(index){const item=adaptationDetails[index];document.querySelectorAll(".adapt-step").forEach((el,i)=>el.classList.toggle("active",i===index));document.getElementById("adaptationDetail").innerHTML=`<header><div><span>ADAPTATION STAGE</span><h3>${item.title}</h3><p>${item.lead}</p></div><b>${item.no}</b></header><div class="adapt-items">${item.items.map((x,i)=>`<div><span>0${i+1}</span><p>${x}</p></div>`).join("")}</div><div class="adapt-output"><span>阶段输出</span><strong>${item.output}</strong></div>`}
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Engine=LinghuEngine, STORE='linghu.sessions.v3';
const levelNames={clerk:'见习',intern:'实习',resident:'住培'};
let currentView='overview', activeCaseIndex=0, sessions={}, toastTimer, recording=false, normalState=null, guideIndex=0, reportStageFocus=0, trajectoryTimer=null, detailMedia='xray';
const activeCase=()=>caseLibrary[activeCaseIndex];
function session(){ return sessions[activeCaseIndex] ||= Engine.createSession(activeCaseIndex); }
function showToast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function persist(){if(recording)return;try{localStorage.setItem(STORE,JSON.stringify({version:3,activeCaseIndex,sessions}));$('saveState').textContent='已保存到本机';}catch(e){$('saveState').textContent='本次会话内保存';}}
function loadSaved(){try{const saved=JSON.parse(localStorage.getItem(STORE));if(saved?.version!==3)return;for(let i=0;i<caseLibrary.length;i++){if(Engine.validSession(saved.sessions?.[i],i))sessions[i]=saved.sessions[i];}if(Number.isInteger(saved.activeCaseIndex)&&saved.activeCaseIndex>=0&&saved.activeCaseIndex<caseLibrary.length)activeCaseIndex=saved.activeCaseIndex;}catch(e){showToast('无法读取上次记录，已开启新会话');}}
function updateHeader(){const meta=pageMeta[currentView];$('pageEyebrow').textContent=currentView==='student'?`${activeCase().code} · ${activeCase().specialty}`:meta[0];$('pageTitle').textContent=currentView==='student'?activeCase().title:meta[1];}
function navigate(view){if(!pageMeta[view])return;if(view!==currentView)TeachingProcess.cancel();ClinicalExperience.stopAll();if(view!=='report')stopTrajectory();currentView=view;document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));document.querySelectorAll('.nav-item').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);el.setAttribute('aria-current',el.dataset.view===view?'page':'false');});updateHeader();if(view==='report')renderReport();if(view==='evidence'){renderSource();renderEvidenceTrace();}window.scrollTo({top:0,behavior:recording?'instant':'smooth'});}
function renderCaseCards(){
  $('caseGrid').innerHTML=caseLibrary.map((c,i)=>`<article class="case-card ${i===0?'featured':''}" data-case-detail="${i}" data-tags="${esc(c.tags+' '+c.specialty)}" tabindex="0" aria-label="查看 ${esc(c.title)} 详细资料">${ClinicalExperience.thumbnail(i)}<div class="case-body"><div class="case-meta"><span class="ready">五阶段训练</span><span>${esc(c.specialty)}</span></div><h3>${c.code} · ${esc(c.title)}</h3><p>${esc(c.patient)} · ${esc(c.summary)}</p>${c.importedId?'<small class="imported-badge">用户导入 · 医学适用性待核验</small>':''}<div class="case-footer"><span>${sessions[i]?.passed.filter(Boolean).length||0} / 5 阶段完成</span><div><button class="secondary-button" data-view-detail="${i}">查看详情</button><button class="primary-button" data-open-case="${i}">${sessions[i]?.events.length?'继续训练':'开始训练'}</button></div></div></div></article>`).join('');
  $('caseGrid').querySelectorAll('[data-open-case]').forEach(b=>b.onclick=e=>{e.stopPropagation();selectCase(Number(b.dataset.openCase),true);});
  $('caseGrid').querySelectorAll('[data-view-detail]').forEach(b=>b.onclick=e=>{e.stopPropagation();openCaseDetail(Number(b.dataset.viewDetail));});
  $('caseGrid').querySelectorAll('[data-case-detail]').forEach(card=>{card.onclick=()=>openCaseDetail(Number(card.dataset.caseDetail));card.onkeydown=e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openCaseDetail(Number(card.dataset.caseDetail));}};});filterCases();
}
function filterCases(){const q=$('caseSearch').value.trim().toLowerCase(), f=document.querySelector('.filter.active').dataset.filter;let count=0;document.querySelectorAll('.case-card').forEach(card=>{const t=(card.textContent+' '+card.dataset.tags).toLowerCase();card.hidden=!(t.includes(q)&&(f==='all'||t.includes(f.toLowerCase())));if(!card.hidden)count++;});$('caseEmpty').hidden=count>0;}
function openCaseDetail(index){
  if(!Number.isInteger(index)||index<0||index>=caseLibrary.length)return;
  const c=caseLibrary[index],d=caseClinicalDetails[index],s=sessions[index]||Engine.createSession(index);
  $('caseDetailTitle').textContent=`${c.code} · ${c.title}`;$('caseDetailPatient').textContent=`${c.patient} · ${c.specialty}`;$('caseDetailStage').textContent=`${stageNames[s.stage]} · ${s.stage+1} / 5`;
  $('caseDetailStages').innerHTML=stageNames.map((name,i)=>`<span class="${i<s.stage||s.passed[i]?'done':i===s.stage?'active':''}"><b>${s.passed[i]?'✓':i+1}</b>${esc(name)}</span>`).join('');
  $('caseDetailText').innerHTML=`<article><span>患者主诉</span><p>${esc(d.chiefComplaint)}</p></article><article><span>现病史</span><p>${esc(d.history)}</p></article><article><span>查体</span><p>${esc(d.exam)}</p></article><article><span>检验</span><p>${esc(d.labs)}</p></article>${ClinicalExperience.refs(index)}`;
  $('caseDetailStart').onclick=()=>{$('caseDetailDialog').close();selectCase(index,true);};
  ClinicalExperience.mountMedia(index);$('caseDetailDialog').showModal();
}
function ensurePrompt(){const s=session();if(!s.messages.some(m=>m.stage===s.stage)){s.messages.push({role:'tutor',stage:s.stage,text:s.stage===0?`${activeCase().patient}，${activeCase().summary}`:`进入${stageNames[s.stage]}阶段。`});s.messages.push({role:'tutor',stage:s.stage,text:activeCase().stages[s.stage][0],coach:true});}}
function selectCase(index,jump=false){if(!Number.isInteger(index)||index<0||index>=caseLibrary.length)throw new Error('病例编号超出范围');TeachingProcess.cancel();ClinicalExperience.stopAll();reportStageFocus=0;activeCaseIndex=index;ensurePrompt();renderStudent();persist();if(jump)navigate('student');else updateHeader();renderCaseCards();}
function renderStages(){const s=session();$('stageList').innerHTML=stageNames.map((name,i)=>{const open=i===0||s.passed.slice(0,i).every(Boolean);return `<li class="${s.stage===i?'active':s.passed[i]?'done':!open?'locked':''}"><button type="button" data-stage="${i}" ${open?'':'disabled'} aria-current="${s.stage===i?'step':'false'}"><b>${s.passed[i]?'✓':i+1}</b><span>${name}<small>${s.passed[i]?'已完成':s.stage===i?'正在进行':open?'可进入':'待解锁'}</small></span></button></li>`;}).join('');$('stageList').querySelectorAll('button').forEach(b=>b.onclick=()=>setStage(Number(b.dataset.stage)));const n=s.passed.filter(Boolean).length;$('stageProgress').style.width=n*20+'%';$('stageProgressText').textContent=`${n} / 5 已完成`;$('stageCount').textContent=`${s.stage+1} / 5`;$('nextStage').disabled=!s.passed[s.stage];$('nextStage').textContent=s.stage===4?'查看学习报告':'进入下一阶段';}
function setStage(index){TeachingProcess.cancel();const s=session();if(index<0||index>4||!s.passed.slice(0,index).every(Boolean))return;s.drafts[s.stage]=$('reasoningInput').value;s.stage=index;ensurePrompt();renderStudent();persist();}
function renderMessages(){const s=session(), box=$('messages');box.innerHTML=s.messages.filter(m=>m.stage===s.stage).map(m=>`<article class="message ${m.role}${m.coach?' coach':''}">${m.role==='tutor'?'<div class="avatar">灵</div>':''}<div class="bubble"><span>${m.role==='tutor'?'灵葫教学助手':'学生'}</span><p>${esc(m.text)}</p>${m.coach?'<div class="inline-tools"><button type="button" data-action="hint">分层提示</button><button type="button" data-action="trace">查看本轮依据</button></div>':''}</div></article>`).join('');box.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>b.dataset.action==='hint'?provideHint():openTrace());box.scrollTop=box.scrollHeight;}
function latestAnswer(){return session().events.filter(e=>e.type==='answer'&&e.stage===session().stage).at(-1);}
function renderStudent(){
  if(!document.getElementById('studentReasoningPath')){const host=document.createElement('article');host.id='studentReasoningPath';document.getElementById('view-student').append(host);}
  const c=activeCase(),s=session();$('caseSelector').value=String(activeCaseIndex);$('learnerLevel').value=s.level;$('hintLevel').value=s.intensity;$('activeCaseCode').textContent=c.code;$('patientTitle').textContent=c.patient;$('patientSummary').textContent=c.summary;$('patientVitals').innerHTML=c.vitals.map(v=>`<span>${esc(v)}</span>`).join('');$('reasoningInput').value=s.drafts[s.stage];
  const recent=latestAnswer(), result=recent?.result;
  $('conversationStatus').textContent=result?.label||'等待回答';$('conversationStatus').className='status '+(result?.status==='pass'?'':'warning');
  $('problemRepresentation').textContent=result?.hits.length?`${c.patient} · 本轮关注：${result.hits.map(h=>h.label).join('、')}`:`${c.patient} · ${c.summary}`;
  const answers=s.events.filter(e=>e.type==='answer'&&e.stage<=s.stage);const mentioned=c.differentials.filter(d=>answers.some(e=>e.text.includes(d)));
  $('dxList').innerHTML=(s.stage>=3?c.differentials:mentioned).map(d=>`<div class="dx-row"><span>${esc(d)}</span><b>${mentioned.includes(d)?'学生已提出':'待比较'}</b></div>`).join('')||'<p class="empty-note">随你的回答逐步整理候选诊断。</p>';
  $('supportBar').style.width=((result?.hits.length||0)/3*100)+'%';$('supportCount').textContent=result?.hits.length||0;$('missingBar').style.width=((result?.missing.length??3)/3*100)+'%';$('missingCount').textContent=result?.missing.length??3;
  $('safetyText').textContent=s.stage>=3?c.safety:'先确认生命体征和病情严重度；具体检查资料按阶段开放。';
  renderEvidenceTrace(recent);
  renderStages();renderMessages();renderTrace();renderReport();updateHeader();
  ClinicalExperience.mountPlayer('studentReasoningPath',activeCaseIndex,s);
}
function feedbackFor(result,stage=session().stage){if(result.status==='pass')return `${result.reason} 请检查各要点之间的联系，再点击“进入下一阶段”。`;if(result.status==='safety')return `${result.reason} ${activeCase().stages[stage][3]} 请修改回答中的处置顺序，并明确需要优先处理的风险。`;return `${result.reason} ${activeCase().stages[stage][3]} 请补充后再提交。`;}
function evidenceRefsHtml(binding,snapshot){return EvidenceLibrary.bindingHtml(activeCaseIndex,stageNames.indexOf(binding.stage),snapshot);}
function renderEvidenceTrace(answer=latestAnswer()){
  const s=session(),binding=evidenceBinding(activeCaseIndex,answer?.stage??s.stage);
  if(answer)binding.id+=`-E${s.events.indexOf(answer)+1}`;
  $('traceBindingId').textContent=binding.id;$('traceStudent').textContent=answer?.text||'提交回答后显示原始判断。';$('traceFeedback').textContent=answer?.result?feedbackFor(answer.result,answer.stage):'提交回答后显示对应教学反馈。';$('traceGuide').innerHTML=evidenceRefsHtml(binding,answer?.sources);
}
async function submitReasoning(text){const result=await TeachingProcess.submit(text);if(!result.ok&&result.reason!=='cancelled')showToast(({empty:'请先写下判断依据',too_long:'本轮回答请不超过 3000 字',busy:'当前正在处理，请勿重复提交',completed_stage:'本阶段已完成，请进入下一阶段'})[result.reason]||'本轮未提交');return result;}
function commitReasoning(text,result,sources){
  const s=session(),at=Date.now();
  s.events.push({type:'answer',at,stage:s.stage,text:text.trim(),level:s.level,result,sources});s.messages.push({role:'student',stage:s.stage,text:text.trim()},{role:'tutor',stage:s.stage,text:feedbackFor(result),coach:true});s.drafts[s.stage]='';
  if(result.status==='pass'){s.passed[s.stage]=true;if(s.passed.every(Boolean))s.completedAt=at;}
  renderStudent();persist();renderCaseCards();ClinicalExperience.mountPlayer('studentReasoningPath',activeCaseIndex,s,{auto:true});return{ok:true,case:activeCase().code,stage:s.stage+1,status:result.status,covered:result.hits.length};
}
function hintText(level,intensity){
  const c=activeCase(),s=session(),groups=Engine.getGroups(activeCaseIndex,s.stage), missing=latestAnswer()?.result.missing||groups;
  const focus=missing.map(g=>g.label), question=c.stages[s.stage][0];
  const base=activeCase().hintLevels?.[s.stage]?.[level]||{clerk:`先把当前问题拆开：${question} 请逐项写出观察或计划询问的内容。`,intern:`你准备使用哪条证据区分不同解释？${c.stages[s.stage][3]}`,resident:`如果当前假设错误，遗漏哪条证据会改变处置？请提出替代解释和需要复核的风险。`}[level];
  if(intensity==='light')return base;
  if(intensity==='medium')return `${base} 优先补充：${focus.slice(0,2).join('、')||'各证据之间的关系'}。`;
  return `${base}\n核对顺序：${groups.map((g,i)=>`${i+1}. ${g.label}`).join('；')}。请按“依据 → 判断 → 下一步”的结构组织回答。`;
}
function provideHint(){const s=session(),text=hintText(s.level,s.intensity);s.events.push({type:'hint',at:Date.now(),stage:s.stage,level:s.level,intensity:s.intensity});s.messages.push({role:'tutor',stage:s.stage,text});renderMessages();renderReport();persist();}
function openCompare(){const s=session();$('hintComparison').innerHTML=Object.entries(levelNames).map(([key,name])=>`<article><span>${name}</span><p>${esc(hintText(key,s.intensity))}</p></article>`).join('');$('compareDialog').showModal();}
function renderTrace(answer){
  const e=answer||latestAnswer(),s=session(),stage=e?.stage??s.stage;$('traceHeading').textContent=`${activeCase().code} · ${stageNames[stage]}`;
  if(!e){$('traceBody').innerHTML='<div class="empty-state">提交本阶段回答后，查看要点识别、遗漏项与追问依据。</div>';return;}
  const r=e.result,binding=evidenceBinding(activeCaseIndex,stage);
  binding.id+=`-E${s.events.indexOf(e)+1}`;
  $('traceBody').innerHTML=`<p class="trace-caption">逐条反馈绑定 · ${esc(binding.id)}</p><ol class="reasoning-steps"><li><b>01 · 学生判断</b><blockquote>${esc(e.text)}</blockquote></li><li><b>02 · 要点核对</b><div class="token-list">${r.hits.map(h=>`<span class="hit">${esc(h.label)} ←「${esc(h.word)}」</span>`).join('')||'<span>尚未识别到本阶段要点</span>'}</div><div class="token-list">${r.missing.map(h=>`<span>${esc(h.label)}待补</span>`).join('')||'<span class="hit">要点已覆盖，请复核其临床联系</span>'}</div></li><li class="feedback-chain-node"><b>03 · 教学反馈</b><p>${esc(feedbackFor(r,stage))}</p></li><li><b>04 · 本阶段关联文献</b><div class="source-bindings">${evidenceRefsHtml(binding,e.sources)}</div><p class="verification-note">文献可直接打开；关联主题不等于已经完成临床适用性审核。</p></li><li><b>05 · 推进依据</b><p>${esc(r.reason)} ${levelNames[e.level]}层级需覆盖至少 ${r.required}/3 项要点；安全复核优先。</p></li><li><b>06 · 追问方向</b><p>${esc(activeCase().stages[stage][3])}</p><button class="secondary-button" id="traceToEvidence">打开本阶段病例资料</button></li></ol>`;
  $('traceToEvidence').onclick=()=>{$('traceDialog').close();const prior=s.stage;s.stage=stage;openEvidence();s.stage=prior;};
}
function openTrace(){renderTrace();$('traceDialog').showModal();}
function openTraceForEvent(index){const event=session().events[index];if(event?.type!=='answer')return;renderTrace(event);$('traceDialog').showModal();}
function openEvidence(){
  const c=activeCase(),s=session();$('evidenceDialogTitle').textContent=`${c.code} · ${stageNames[s.stage]}资料`;
  const media=ClinicalExperience.evidence(activeCaseIndex,s.stage),unlocked=media.unlocked;
  $('evidenceSource').textContent='本病例教学资料';$('evidenceChecklist').innerHTML=(unlocked?c.evidence:[c.summary,...c.vitals]).map(x=>`<li>${esc(x)}</li>`).join('');
  $('evidenceNote').textContent=media.note;
  $('evidenceVisual').className='case-evidence-visual reference-evidence';$('evidenceVisual').innerHTML=media.visual;
  $('evidenceDialog').showModal();s.events.push({type:'evidence',stage:s.stage,at:Date.now()});renderReport();persist();
}
function duration(ms){const sec=Math.floor(Math.max(0,ms)/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
function radarPoint(index,value,radius=88){const angle=-Math.PI/2+index*Math.PI*2/5,r=radius*value/100;return [160+Math.cos(angle)*r,118+Math.sin(angle)*r];}
function radarPolygon(values,radius=88){return values.map((v,i)=>radarPoint(i,v,radius).map(n=>n.toFixed(1)).join(',')).join(' ');}
function renderRadar(values){
  const grids=[25,50,75,100].map(v=>`<polygon class="radar-grid ${v<100?'inner':''}" points="${radarPolygon([v,v,v,v,v])}"></polygon>`).join('');
  const axes=stageNames.map((_,i)=>{const [x,y]=radarPoint(i,100);return `<line x1="160" y1="118" x2="${x}" y2="${y}"></line>`;}).join('');
  const labels=stageNames.map((name,i)=>{const [x,y]=radarPoint(i,122);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc(name)} ${values[i]}%</text>`;}).join('');
  return `<svg viewBox="0 0 320 250" role="img" aria-label="五阶段教学要点覆盖雷达图"><g class="radar-axes">${grids}${axes}</g><polygon class="radar-value" points="${radarPolygon(values)}"></polygon><g class="radar-dots">${values.map((v,i)=>{const [x,y]=radarPoint(i,v);return `<circle cx="${x}" cy="${y}" r="4"></circle>`;}).join('')}</g><g>${labels}</g></svg><div class="radar-legend">${stageNames.map((n,i)=>`<button data-report-stage="${i}" class="${i===reportStageFocus?'active':''}"><span>${i+1}</span>${esc(n)}<b>${values[i]}%</b></button>`).join('')}</div>`;
}
function teacherScores(m,s){if(!m.answers)return null;const avg=m.coverage.reduce((a,b)=>a+b,0)/5;return {logic:clamp(Math.round(38+avg*.42+m.passed*4-m.unresolved*4)),safety:clamp(Math.round(72+m.passed*4-m.unsafe*18)),evidence:clamp(Math.round(34+m.evidence*12+m.coverage[2]*.38)),level:clamp(Math.round(56+m.passed*5-Math.max(0,m.hints-m.passed)*3+(s.level==='resident'?8:s.level==='intern'?4:0)))};}
function renderTeacherEvaluation(m,s){
  const scores=teacherScores(m,s),answers=s.events.filter(e=>e.type==='answer');
  const rows=[['逻辑性','logic'],['安全性','safety'],['证据使用','evidence'],['层级匹配','level']].map(([label,key])=>`<div class="evaluation-metric"><span>${label}</span><i><b style="width:${scores?.[key]||0}%"></b></i><strong>${scores?scores[key]:'—'}</strong></div>`).join('');
  const latestByStage=stageNames.map((_,stage)=>answers.filter(e=>e.stage===stage).at(-1));
  const omissions=latestByStage.flatMap((e,stage)=>e?.result.missing.slice(0,1).map(x=>`${stageNames[stage]}：${x.label}`)||(s.passed[stage]?[]:[`${stageNames[stage]}：尚未形成完整记录`])).slice(0,3);
  const turns=answers.map((e,i)=>({e,round:i+1})).filter(x=>x.e.result.status==='pass'||x.e.result.status==='safety'||x.e.result.status==='offtrack').slice(-3).map(x=>`第${x.round}轮：${stageNames[x.e.stage]} · ${x.e.result.status==='pass'?'依据补充后允许推进':x.e.result.status==='safety'?'触发安全优先复核':'推理方向需要校准'}`);
  $('teacherEvaluation').innerHTML=`<div class="evaluation-dashboard"><section><h4>综合评价</h4>${rows}<small>基于教学脚本要点、事件记录与提示使用计算，仅用于演示。</small></section><section><h4>关键遗漏</h4><ul>${(omissions.length?omissions:['暂无回答，尚不能生成关键遗漏。']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>关键转折</h4><ul>${(turns.length?turns:['完成回答后将标记纠错与修正节点。']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section></div>`;
}
function renderTrajectory(){
  reportStageFocus=clamp(reportStageFocus,0,4);
  ClinicalExperience.mountPlayer('trajectoryStepper',activeCaseIndex,session(),{stage:reportStageFocus,report:true});
}
function stopTrajectory(){if(trajectoryTimer){clearInterval(trajectoryTimer);trajectoryTimer=null;}const b=$('playTrajectory');if(b)b.textContent='▶ 动态演示';}
function toggleTrajectory(){if(trajectoryTimer){stopTrajectory();return;}$('playTrajectory').textContent='Ⅱ 暂停';reportStageFocus=0;renderTrajectory();trajectoryTimer=setInterval(()=>{reportStageFocus=(reportStageFocus+1)%5;renderTrajectory();},1400);}
function renderReport(){
  const s=session(),c=activeCase(),m=Engine.metrics(s),last=s.events.at(-1);
  $('reportCaseTitle').textContent=`${c.code} · ${c.title} · ${levelNames[s.level]} · 会话跨度 ${duration((s.completedAt||last?.at||s.createdAt)-s.createdAt)}`;
  $('reportScore').textContent=m.answers?m.score:'—';$('reportSummary').textContent=m.answers?`已覆盖 ${m.covered}/15 项教学要点，完成 ${m.passed}/5 个阶段。${m.unresolved?`仍有 ${m.unresolved} 个已作答阶段需要补充。`:'已作答阶段均已满足当前推进条件。'}`:'尚未提交回答。完成训练后，本页将汇总实际回答、提示使用与阶段记录。';
  $('reportStats').textContent=`${m.answers} 次回答 · ${m.hints} 次提示 · ${m.evidence} 次查阅资料 · ${m.unsafe} 次安全复核`;
  $('reportDimensions').innerHTML=renderRadar(m.coverage);$('reportDimensions').querySelectorAll('[data-report-stage]').forEach(b=>b.onclick=()=>{reportStageFocus=Number(b.dataset.reportStage);renderTrajectory();});
  renderTeacherEvaluation(m,s);renderTrajectory();$('playTrajectory').onclick=toggleTrajectory;
  $('reportTimeline').innerHTML=s.events.map((e,index)=>`<li class="${e.type==='answer'?(e.result.status==='pass'?'good':e.result.status==='safety'?'risk':'warn'):'good'}"><time>${duration(e.at-s.createdAt)}</time><div><b>${esc(stageNames[e.stage])} · ${e.type==='answer'?esc(e.result.label):({hint:'使用分层提示',evidence:'查阅病例资料',level:'调整学习层级'})[e.type]}</b><p>${esc(e.type==='answer'?e.result.reason:e.type==='hint'?levelNames[e.level]+' / '+e.intensity:e.type==='level'?levelNames[e.level]:'查看当前阶段开放资料')}</p>${e.type==='answer'?`<details><summary>查看当时回答</summary><p>${esc(e.text)}</p></details><button class="trace-event-button" data-trace-event="${index}">学生判断 → 教学反馈 → 教材 / 指南</button>`:''}</div></li>`).join('')||'<li><div><b>暂无训练记录</b><p>记录将在首次回答或查阅资料后生成。</p></div></li>';
  $('reportTimeline').querySelectorAll('[data-trace-event]').forEach(b=>b.onclick=()=>openTraceForEvent(Number(b.dataset.traceEvent)));
  const advice=[];for(let i=0;i<5;i++){if(!s.passed[i])advice.push(`${stageNames[i]}：${s.events.some(e=>e.type==='answer'&&e.stage===i)?'复核未覆盖要点后重试。':'尚未完成，请继续训练。'}`);}
  if(m.unsafe)advice.unshift('回看标记为“安全待复核”的回答，说明如何修正处置优先级。');if(!advice.length)advice.push('五阶段已完成，可切换学习层级或选取另一病例比较推理方法。');
  $('teacherAdvice').innerHTML=advice.slice(0,5).map((text,i)=>`<div class="action-card"><span>0${i+1}</span><p>${esc(text)}</p></div>`).join('');
}
function resetDemo(){TeachingProcess.cancel();sessions[activeCaseIndex]=Engine.createSession(activeCaseIndex);ensurePrompt();renderStudent();persist();renderCaseCards();showToast('当前病例已开始新一轮训练');}
function downloadJSON(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportReport(){const s=session();downloadJSON(`灵葫-${activeCase().code.replace(' ','-')}-学习记录.json`,{version:3,exportedAt:new Date().toISOString(),caseTitle:activeCase().title,scoring:'每阶段3项文本核对规则，累计覆盖项数/15；不是临床能力量表或模型基准分数',metrics:Engine.metrics(s),session:s});}
function exportTemplate(){downloadJSON('灵葫-可导入病例模板.json',CaseImport.sample());}
function renderSource(key){EvidenceLibrary.mount(key);}
function enterRecording(){if(recording)return;TeachingProcess.cancel();normalState={sessions,activeCaseIndex,currentView};sessions={};activeCaseIndex=0;recording=true;guideIndex=0;document.body.classList.add('recording');$('recordingDock').hidden=false;$('recordMode').textContent='退出录屏模式';$('saveState').textContent='录屏会话';ensurePrompt();renderStudent();renderCaseCards();updateGuide();showToast('独立录屏会话已就绪，原训练记录已保留');}
function exitRecording(){if(!recording)return;TeachingProcess.cancel();const back=normalState;recording=false;sessions=back.sessions;activeCaseIndex=back.activeCaseIndex;normalState=null;document.body.classList.remove('recording');$('recordingDock').hidden=true;$('recordMode').textContent='录屏模式';ensurePrompt();renderStudent();renderCaseCards();navigate(back.currentView);persist();}
function updateGuide(){const step=tourSteps[guideIndex],before=tourSteps.slice(0,guideIndex).reduce((n,s)=>n+s[3],0);$('guideLabel').textContent=`${guideIndex+1}/8 · ${step[1]} · ${duration(before*1000)}—${duration((before+step[3])*1000)}`;$('guideTip').textContent=step[2];$('guidePrev').disabled=guideIndex===0;$('guideNext').textContent=guideIndex===7?'结束导览':'下一镜';navigate(step[0]);}
function bindEvents(){
  document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.view));document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>navigate(b.dataset.jump));
  $('caseSelector').onchange=e=>selectCase(Number(e.target.value));$('reasoningForm').onsubmit=e=>{e.preventDefault();submitReasoning($('reasoningInput').value);};$('reasoningInput').addEventListener('input',()=>{session().drafts[session().stage]=$('reasoningInput').value;persist();});
  $('sampleAnswer').onclick=()=>{const s=session();$('reasoningInput').value=activeCase().stages[s.stage][1];s.drafts[s.stage]=$('reasoningInput').value;persist();$('reasoningInput').focus();};
  $('nextStage').onclick=()=>session().stage===4?navigate('report'):setStage(session().stage+1);$('requestHint').onclick=provideHint;$('openEvidence').onclick=openEvidence;$('viewTrace').onclick=openTrace;$('compareHints').onclick=openCompare;
  $('learnerLevel').onchange=e=>{const s=session();s.level=e.target.value;s.events.push({type:'level',at:Date.now(),stage:s.stage,level:s.level});persist();renderStudent();};$('hintLevel').onchange=e=>{session().intensity=e.target.value;persist();};
  document.querySelectorAll('.pipeline-step').forEach(b=>b.onclick=()=>renderPipeline(Number(b.dataset.step)));document.querySelectorAll('.adapt-step').forEach(b=>b.onclick=()=>renderAdaptation(Number(b.dataset.adapt)));
  $('cancelProcessing').onclick=TeachingProcess.cancel;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-evidence-id]');if(b)EvidenceLibrary.open(b.dataset.evidenceId);});
  $('caseSearch').oninput=filterCases;document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));filterCases();});document.querySelectorAll('.source-item').forEach(b=>b.onclick=()=>renderSource(b.dataset.source));
  $('printReport').onclick=()=>{renderReport();window.print();};$('exportReport').onclick=exportReport;$('downloadTemplate').onclick=exportTemplate;$('resetDemo').onclick=resetDemo;
  $('recordMode').onclick=()=>recording?exitRecording():enterRecording();$('tourTrigger').onclick=enterRecording;$('guideNext').onclick=()=>{if(guideIndex===7)exitRecording();else{guideIndex++;updateGuide();}};$('guidePrev').onclick=()=>{guideIndex=Math.max(0,guideIndex-1);updateGuide();};$('hideGuide').onclick=()=>{$('recordingDock').classList.toggle('compact-guide');};$('exitRecording').onclick=exitRecording;
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  document.addEventListener('keydown',e=>{if(e.key==='F8'){e.preventDefault();recording?exitRecording():enterRecording();}});
}
function registerWebMCP(){const ctx=document.modelContext;if(!ctx?.registerTool)return;const add=(name,description,properties,required,execute)=>{try{Promise.resolve(ctx.registerTool({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute})).catch(()=>{});}catch(e){}};
  add('navigate_linghu_section','切换灵葫模块',{section:{type:'string',enum:Object.keys(pageMeta)}},['section'],({section})=>{if(!pageMeta[section])throw Error('未知模块');navigate(section);return{section};});
  add('select_training_case','选择并恢复病例训练',{caseNumber:{type:'integer',minimum:1}},['caseNumber'],({caseNumber})=>{selectCase(caseNumber-1,true);return{case:activeCase().code};});
  add('submit_reasoning_response','提交当前阶段回答，返回要点核对状态',{response:{type:'string',minLength:1,maxLength:3000}},['response'],({response})=>submitReasoning(response));
  add('reset_training_case','重新开始当前病例，清除本轮记录',{},[],()=>{resetDemo();return{stage:1};});
}
function refreshCaseSelectors(){$('caseSelector').innerHTML=caseLibrary.map((c,i)=>`<option value="${i}">${esc(c.code)} · ${esc(c.title)}</option>`).join('');$('dataCaseCount').textContent=caseLibrary.length;}
try{CaseImport.restore();}catch(e){showToast('导入病例存档未加载：'+e.message);}
loadSaved();refreshCaseSelectors();CaseImport.initUI();
bindEvents();ensurePrompt();renderStudent();renderCaseCards();renderPipeline(0);renderAdaptation(0);renderSource('paper');navigate('overview');registerWebMCP();
