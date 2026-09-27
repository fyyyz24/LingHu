/* Observable local execution phases, never fabricated model tokens / hidden chain-of-thought. */
const TeachingProcess = (() => {
  let active=null;
  const controls=()=>document.querySelectorAll('#reasoningForm button,#reasoningInput,#caseSelector,#learnerLevel,#hintLevel,#nextStage,#stageList button,#requestHint,#sampleAnswer');
  function unlock(run){run?.controls.forEach(([el,disabled])=>el.disabled=disabled);}
  function cancel(){if(!active)return;const run=active;active=null;run.cancelled=true;clearTimeout(run.timer);run.wake?.();unlock(run);document.getElementById('processingPanel').hidden=true;}
  const wait=(run)=>new Promise(resolve=>{run.wake=resolve;run.timer=setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?30:1000);});
  function paint(step,description){const host=document.getElementById('processingPanel');host.hidden=false;host.querySelector('.processing-description').textContent=description;host.querySelectorAll('[data-phase]').forEach((el,i)=>{el.classList.toggle('active',i===step);el.classList.toggle('done',i<step);});host.setAttribute('aria-busy','true');}
  async function submit(text){
    if(active)return {ok:false,reason:'busy'};
    const value=typeof text==='string'?text.trim():'';
    if(!value||value.length>3000)return {ok:false,reason:!value?'empty':'too_long'};
    const index=activeCaseIndex,s=session(),stage=s.stage;
    if(s.passed[stage])return {ok:false,reason:'completed_stage'};
    const run={cancelled:false,controls:[...controls()].map(el=>[el,el.disabled])};active=run;run.controls.forEach(([el])=>el.disabled=true);
    try{
      paint(0,`已整理 ${activeCase().code} · ${stageNames[stage]} 与 ${value.length} 字作答；不会上传患者资料。`);await wait(run);if(run.cancelled)return{ok:false,reason:'cancelled'};
      const sources=EvidenceLibrary.forStage(index,stage).map(r=>({...r}));
      paint(1,`已关联 ${sources.length} 条阶段文献索引，可在反馈中打开原文；不是实时联网检索结果。`);await wait(run);if(run.cancelled)return{ok:false,reason:'cancelled'};
      const result=Engine.analyze(index,stage,value,s.level);
      paint(2,`完成教学要点核对：${result.hits.length}/3 项；${result.label}。`);await wait(run);if(run.cancelled)return{ok:false,reason:'cancelled'};
      paint(3,'正在组织分层追问、风险提醒与证据入口。');await wait(run);if(run.cancelled)return{ok:false,reason:'cancelled'};
      if(session()!==s||activeCaseIndex!==index||s.stage!==stage)return {ok:false,reason:'stale'};
      active=null;unlock(run);document.getElementById('processingPanel').hidden=true;
      return commitReasoning(value,result,sources);
    }catch(error){showToast(`本轮未保存：${error.message}`);return {ok:false,reason:'error'};}
    finally{if(active===run){active=null;unlock(run);document.getElementById('processingPanel').hidden=true;}}
  }
  return {submit,cancel,isBusy:()=>!!active};
})();
