/* Evidence-led playback: renders observable student events, never model internals. */
const ClinicalExperience = (() => {
  const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link = (url, label) => url ? `<a href="${html(url)}" target="_blank" rel="noopener noreferrer">${html(label)} ↗</a>` : `<span>${html(label)}</span>`;
  const resource = index => caseResources[index];
  function thumbnail(index) {
    const a = resource(index)?.assets[0];
    return a ? `<div class="case-reference-thumb"><img src="${html(a.src)}" alt="${html(a.alt)}" loading="lazy"><span>教学参考 · ${html(a.label)}</span></div>` : '<div class="case-placeholder"><span>临床资料</span></div>';
  }
  function refs(index) {
    const r = resource(index);
    if (!r) return '';
    return `<article class="case-reference-summary"><span>学习资料与影像解读</span><p>${html(r.context)}</p><ul>${r.points.map(p=>`<li>${html(p)}</li>`).join('')}</ul><div class="reference-links">${r.references.map(ref=>`${link(ref.url,ref.title)}<small>${html(ref.publisher)} · ${html(ref.section)}</small>`).join('')}</div><p class="reference-boundary">以上为公开学习资料，病例年龄、病程和检验结果仍为教学编排；不据参考图追加该患者的诊断。</p></article>`;
  }
  function mountMedia(index) {
    const r=resource(index), tabs=document.getElementById('caseMediaTabs');
    tabs.innerHTML=r.assets.map((a,i)=>`<button type="button" data-asset="${i}">${html(a.label)}</button>`).join('');
    const view=document.getElementById('caseMediaView');
    if(!r.assets.length){view.className='media-view reference-view';view.innerHTML='<p class="empty-state">本例未导入影像，请依照已登记文字资料训练。</p>';document.getElementById('caseMediaCaption').textContent='没有原始影像时不生成或替换患者图片。';return;}
    function selectAsset(assetIndex) {
      const a=r.assets[assetIndex];
      tabs.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===assetIndex);b.setAttribute('aria-pressed',String(i===assetIndex));});
      view.className='media-view reference-view';
      view.innerHTML=`<div class="reference-image-viewport" tabindex="0" aria-label="影像，可放大并滚动查看"><img src="${html(a.src)}" alt="${html(a.alt)}"></div><div class="image-controls"><label>放大 <input type="range" min="1" max="3" step="0.25" value="1" aria-label="影像放大倍数"></label><output>1×</output><button type="button">复位</button></div>`;
      const img=view.querySelector('img'), range=view.querySelector('input'), output=view.querySelector('output');
      function zoom(){img.style.width=`${Number(range.value)*100}%`;img.style.maxWidth='none';output.value=`${range.value}×`;}
      range.oninput=zoom;view.querySelector('button').onclick=()=>{range.value=1;zoom();};
      img.onerror=()=>{view.querySelector('.reference-image-viewport').innerHTML='<p class="empty-state">本地影像未加载，请从下方原始来源查看。</p>';};
      document.getElementById('caseMediaCaption').innerHTML=`<b class="reference-tag">${html(a.role)}</b><span>${html(a.caption)}</span><span class="image-limit">${html(a.limit)}</span><span class="image-credit">${html(a.author)} · ${link(a.licenseUrl,a.license)} · ${a.sourceUrl?link(a.sourceUrl,'原始来源'):html('本地图片来源：'+a.sourceNote)}</span>`;
    }
    tabs.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>selectAsset(i));selectAsset(0);
  }
  function evidence(index, stage) {
    const r=resource(index), a=r.assets[0];
    if(!a)return {unlocked:stage>=2,visual:'<span>本例未导入影像</span>',note:'请查看已开放的文字检查资料。'};
    const unlocked=stage>=2 || (index===4 && stage>=1);
    return {unlocked,visual:unlocked?`<img class="evidence-reference-image" src="${html(a.src)}" alt="${html(a.alt)}"><small>${html(a.role)} · ${a.sourceUrl?link(a.sourceUrl,'查看原图来源'):html('本地图片 · '+a.sourceNote)}</small>`:'<span>资料按训练阶段开放</span>',note:unlocked?`${a.caption} ${a.limit}`:'请先完成病史采集与查体；本病例的公开参考影像在对应阶段开放。'};
  }
  function referenceEvidence(index) {
    const r=resource(index);return r?`<div class="verified-reference"><b>公开学习资料</b>${r.references.map(ref=>`<p>${link(ref.url,ref.title)}<small>${html(ref.section)}</small></p>`).join('')}<small>资料来源已登记；具体反馈条目与病例适用性仍需临床教师审核。</small></div>`:'';
  }
  const players=new Map();
  function stopAll(){players.forEach(p=>p.stop());}
  function frames(s,stage){return s.events.map((e,i)=>({...e,eventIndex:i})).filter(e=>e.type==='answer'&&e.stage===stage);}
  function nodes(caseIndex,stage,event,previous){
    const c=caseLibrary[caseIndex],d=caseClinicalDetails[caseIndex];
    const facts=c.stageFacts?.[stage]?.join('；')||[d.chiefComplaint,d.exam,d.labs+' '+c.stages[stage][0]+'（公开参考影像不等于本病例检查结果。）', '综合已开放的病史、查体与检查资料；按可能性与危险性比较解释。','以已获得的证据、安全优先级与当前任务为依据制定下一步计划。'][stage];
    return [
      {label:'病例证据',tag:'已开放信息',text:facts,items:[]},
      {label:'学生判断',tag:event?'本轮原始回答':'等待作答',text:event?.text||'提交一次回答后，这里将保留你的原始判断。',items:[]},
      {label:'证据核对',tag:event?.result.label||'等待核对',text:event?.result.reason||c.stages[stage][0],items:event?[...event.result.hits.map(h=>({label:h.label,hit:true})),...event.result.missing.map(h=>({label:h.label+' · 待补',hit:false}))]:[]},
      {label:'教学反馈与修正',tag:previous?'对比上一轮':'下一步思考',text:event?(event.result.status==='pass'?'本轮要点已覆盖。请解释证据之间的联系，再推进下一阶段。':c.stages[stage][3]+' 请补充证据后再次提交。'):'依据实际回答生成教学提示，不预设你的判断。',items:previous?[{label:`上一轮：${previous.result.hits.length}/3 项 → 本轮：${event.result.hits.length}/3 项`,hit:event.result.hits.length>=previous.result.hits.length}]:[]}
    ];
  }
  function mountPlayer(hostId,caseIndex,s,{stage=s.stage,report=false,auto=false}={}) {
    const host=document.getElementById(hostId);if(!host)return;
    players.get(hostId)?.stop();
    let activeStage=stage, list=frames(s,stage), round=Math.max(0,list.length-1), step=0, timer=null,speed=1;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    host.className=`reasoning-player ${report?'report-player':'student-player'}`;
    host.innerHTML=`<div class="reasoning-player-head"><div><span class="section-kicker">EVIDENCE → JUDGMENT → FEEDBACK</span><h3>${report?'临床思维轨迹回放':'本轮思维路径'}</h3></div><span class="player-status">等待记录</span></div><p class="player-explainer">按实际作答展示证据与判断变化 · 教学推理摘要，不是模型内部思维日志</p>${report?`<div class="replay-stage-tabs">${stageNames.map((name,i)=>`<button type="button" data-replay-stage="${i}"><span>${i+1}</span>${html(name)}<small>${frames(s,i).length} 轮</small></button>`).join('')}</div>`:''}<div class="replay-toolbar"><div><button type="button" data-replay="prev" aria-label="上一个思维节点">←</button><button type="button" data-replay="play">▶ 播放路径</button><button type="button" data-replay="next" aria-label="下一个思维节点">→</button></div><label>轮次 <select aria-label="选择作答轮次" data-replay="round"></select></label><label>速度 <select aria-label="回放速度" data-replay="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div><div class="thought-path" role="group" aria-label="临床推理路径"></div><div class="thought-inspector" aria-live="polite"></div><div class="replay-progress"><input type="range" min="0" max="3" step="1" value="0" aria-label="思维路径进度"><span></span></div><div class="replay-evidence"></div>`;
    const find=q=>host.querySelector(q), play=find('[data-replay="play"]');
    function stop(){if(timer){clearTimeout(timer);timer=null;}play.textContent='▶ 播放路径';host.classList.remove('is-playing');}
    function paint(){
      const e=list[round], n=nodes(caseIndex,activeStage,e,list[round-1]);
      find('.player-status').textContent=e?`${stageNames[activeStage]} · 第 ${round+1} 轮`:`${stageNames[activeStage]} · 尚无回答`;
      host.querySelectorAll('[data-replay-stage]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.replayStage)===activeStage);b.setAttribute('aria-pressed',String(Number(b.dataset.replayStage)===activeStage));});
      find('[data-replay="round"]').innerHTML=list.length?list.map((x,i)=>`<option value="${i}" ${i===round?'selected':''}>第 ${i+1} 轮 · ${html(x.result.label)}</option>`).join(''):'<option>暂无记录</option>';
      find('[data-replay="round"]').disabled=!list.length;play.disabled=!e;
      find('.thought-path').innerHTML=n.map((node,i)=>`<button type="button" data-node="${i}" class="thought-node ${i===step?'active':i<step?'visited':''}" aria-pressed="${i===step}"><span class="node-orbit">${i<step?'✓':String(i+1).padStart(2,'0')}</span><b>${node.label}</b><small>${html(node.tag)}</small></button>${i<3?'<div class="thought-edge" aria-hidden="true"><i></i></div>':''}`).join('');
      find('.thought-inspector').innerHTML=`<div><span>${String(step+1).padStart(2,'0')} / 04</span><h4>${n[step].label}</h4></div><p>${html(n[step].text)}</p><div class="thought-tokens">${n[step].items.map(t=>`<span class="${t.hit?'matched':'missing'}">${html(t.label)}</span>`).join('')}</div>${step===3&&list[round-1]?`<details><summary>对照上一轮原始回答</summary><blockquote>${html(list[round-1].text)}</blockquote></details>`:''}`;
      find('.replay-progress input').value=step;find('.replay-progress span').textContent=`${step+1} / 4`;
      find('.replay-evidence').innerHTML=e?`<span>每轮回答均保留核对结果与资料入口</span><button type="button" data-replay="trace">查看本轮反馈依据 ↗</button>`:'<span>还没有训练记录。完成作答后可播放，不会生成虚构轨迹。</span>';
      host.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>{stop();step=Number(b.dataset.node);paint();});
      const trace=find('[data-replay="trace"]');if(trace)trace.onclick=()=>openTraceForEvent(e.eventIndex);
      if(!reduced)find('.thought-inspector').animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:250,easing:'ease-out'});
    }
    function tick(){timer=setTimeout(()=>{if(step>=3){stop();return;}step++;paint();tick();},1900/speed);}
    function start(){if(!list.length)return;if(step===3)step=0;paint();play.textContent='Ⅱ 暂停';host.classList.add('is-playing');tick();}
    play.onclick=()=>timer?stop():start();
    find('[data-replay="prev"]').onclick=()=>{stop();step=Math.max(0,step-1);paint();};
    find('[data-replay="next"]').onclick=()=>{stop();step=Math.min(3,step+1);paint();};
    find('[data-replay="speed"]').onchange=e=>{const was=!!timer;stop();speed=Number(e.target.value);if(was)start();};
    find('[data-replay="round"]').onchange=e=>{stop();round=Number(e.target.value);step=0;paint();};
    find('.replay-progress input').oninput=e=>{stop();step=Number(e.target.value);paint();};
    host.querySelectorAll('[data-replay-stage]').forEach(b=>b.onclick=()=>{stop();activeStage=Number(b.dataset.replayStage);list=frames(s,activeStage);round=Math.max(0,list.length-1);step=0;paint();});
    players.set(hostId,{stop});paint();if(auto&&!reduced)start();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
  return {thumbnail,refs,mountMedia,evidence,referenceEvidence,mountPlayer,stopAll,frames,nodes};
})();
