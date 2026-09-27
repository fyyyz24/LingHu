/* 可替换的教学要点核对层。判断基于文本规则，不产生模型置信度。 */
(function (root) {
  'use strict';
  // 每行对应一个病例；每阶段三组教学要点。竖线分隔可接受表述。
  const terms = [
    [ ['病程|5天|5 天|时间|进展','发热|咳嗽|胸痛|端坐','血栓|危险因素|下肢|肿胀'], ['呼吸音|单侧|右侧','叩诊|浊音','语颤'], ['纵隔|气管','肋膈角|膈面','密度|致密影|透亮|液体'], ['胸腔积液|积液','肺不张|实变','脓胸|恶性|危险'], ['吸氧|氧疗|ABC|血氧','超声|检查','穿刺|引流|病因'] ],
    [ ['接触|暴露|流行病','免疫|用药','气促|胸痛|咯血|进展'], ['频率|呼吸肌|呼吸功','啰音|肺音','发绀|意识'], ['双肺|多叶|分布','磨玻璃','间隔|结节'], ['病毒','CMV|免疫抑制','肺水肿|心衰|容量'], ['氧疗|吸氧|监测','病原|炎症','呼吸支持|升级|窘迫'] ],
    [ ['胸痛|活动|气促','吸烟|血压|血脂|糖尿病','家族'], ['血压|心脏|杂音','脉搏|外周','心衰|颈动脉'], ['节段|定位|位置','范围|密度','积分|负荷'], ['冠脉|冠状','瓣膜','炎症|既往'], ['风险|血压|血脂','症状|缺血|功能','生活方式|血糖|管理'] ],
    [ ['疼痛|排便','出血|体重','手术'], ['压痛|反跳痛','肌紧张|腹膜','肠鸣音|腹胀|包块'], ['长度|对称','强化|周围','金属|手术'], ['炎症|肠炎','术后|金属','肿瘤|消瘦|淋巴'], ['检查|肠镜|CT','复查|随访','急腹症|外科'] ],
    [ ['家族','脱位|骨折','出血|伤口|心血管'], ['皮肤|瘢痕','Beighton|评分','脱位|体型'], ['基因','心动图|超声','血管|并发症'], ['EDS|瘢痕|皮肤过伸','晶状体|主动脉|马凡','骨折|成骨不全'], ['随访|多学科','运动|伤口','遗传|家系'] ],
    [ ['现场|安全','时间|目击','基础病|用药|外伤|中毒'], ['ABC|气道','呼吸|循环','瞳孔|偏瘫|外伤|意识'], ['血糖','血氧|心电图|体温','CT|实验室'], ['局灶|发病|卒中','血糖','瞳孔|外伤|呼吸|药物'], ['呼叫|急救|120','气道|呼吸|复苏','禁食|禁饮|变化|记录'] ]
  ];
  const levels = {clerk:2, intern:2, resident:3};
  const stateLabels = {pass:'允许推进', insufficient:'证据不足', offtrack:'方向待校准', safety:'安全待复核', empty:'等待回答'};
  function getGroups(caseIndex, stage) { if(!terms[caseIndex]?.[stage])throw new Error('病例规则不存在');return terms[caseIndex][stage].map((term,i)=>({id:`${stage}-${i}`,label:term.split('|')[0],aliases:term.split('|')})); }
  function registerCase(index, groups) { if(index!==terms.length || groups.length!==5 || groups.some(g=>g.length!==3))throw new Error('病例规则结构错误');terms.push(groups.map(g=>g.map(x=>x.join('|')))); }
  function affirmativeMatch(text, word) {
    // 排除显式否定和“忽略”式表达；不将否定文本计为已覆盖。
    const low=text.toLowerCase(), token=word.toLowerCase();
    let start=0, pos;
    while ((pos=low.indexOf(token,start))!==-1) {
      const prefix=low.slice(Math.max(0,pos-7),pos);
      if (!/(?:不需要|不用|无需|忽略|不考虑|不评估|不检查|不查|不问|不测|不关注|不监测|未提及|没有|未见|否认|排除|无)(?:任何)?$/.test(prefix)) return word;
      start=pos+token.length;
    }
    return null;
  }
  function analyze(caseIndex,stage,text,level='clerk') {
    const value=String(text||'').trim().slice(0,3000), groups=getGroups(caseIndex,stage);
    const hits=[], missing=[];
    groups.forEach(g=> { const word=g.aliases.find(a=>affirmativeMatch(value,a)); (word?hits:missing).push({...g,word:word||null}); });
    const risky=value.split(/[。；;！!？?\n]/).some(sentence => !/不能|不应|不要|避免|不可|禁止/.test(sentence) && /(?:不用|无需|不需要|忽略)(?:评估|检查|监测|关注|处理)?(?:低氧|呼吸|气道|血氧|血糖|急救)|直接(?:出院|回家)|(?:等待|等他|等患者)(?:自行|自己)?(?:清醒|醒来)|意识不清.{0,6}(?:喂水|喂饭)/.test(sentence));
    const safetyOmitted=stage===4 && !hits.some(h=>h.id===`${stage}-${caseIndex===3?2:0}`);
    let status = !value?'empty': risky || (safetyOmitted && hits.length>0)?'safety':hits.length >= levels[level]?'pass':hits.length?'insufficient':'offtrack';
    const reason = status==='pass'?`已覆盖 ${hits.length}/${groups.length} 项本阶段要点，可进入下一阶段。`:status==='safety'?'处置优先级或关键安全要点需要复核。':status==='offtrack'?'尚未识别到本阶段所需依据，请围绕当前问题补充。':status==='empty'?'请输入判断依据。':`已覆盖 ${hits.length}/${groups.length} 项要点，还需补充判断依据。`;
    return {status,label:stateLabels[status],hits,missing,required:levels[level],score:Math.round(hits.length/groups.length*100),reason,risky};
  }
  function createSession(caseIndex, now=Date.now()) { return {caseIndex,createdAt:now,stage:0,passed:[false,false,false,false,false],events:[],messages:[],drafts:['','','','',''],level:'clerk',intensity:'medium',completedAt:null}; }
  function metrics(session) {
    const answers=session.events.filter(e=>e.type==='answer');
    const coverage=terms[session.caseIndex].map((_,stage)=>new Set(answers.filter(e=>e.stage===stage).flatMap(e=>e.result.hits.map(h=>h.id))).size);
    const latest=Array.from({length:5},(_,s)=>answers.filter(e=>e.stage===s).at(-1));
    const count=coverage.reduce((a,b)=>a+b,0);
    return {coverage:coverage.map(n=>Math.round(n/3*100)),score:Math.round(count/15*100),covered:count,answers:answers.length,hints:session.events.filter(e=>e.type==='hint').length,evidence:session.events.filter(e=>e.type==='evidence').length,passed:session.passed.filter(Boolean).length,unsafe:answers.filter(e=>e.result.status==='safety').length,unresolved:latest.filter(e=>e && e.result.status!=='pass').length};
  }
  function validSession(s,index) {
    return s && s.caseIndex===index && Number.isFinite(s.createdAt) && Number.isInteger(s.stage) && s.stage>=0 && s.stage<5 && Array.isArray(s.passed) && s.passed.length===5 && s.passed.every(p=>typeof p==='boolean') && Array.isArray(s.events) && s.events.every(e=>e && Number.isFinite(e.at) && Number.isInteger(e.stage) && e.stage>=0 && e.stage<5 && ['answer','hint','evidence','level'].includes(e.type) && (e.type!=='answer'||(e.result && Array.isArray(e.result.hits) && Array.isArray(e.result.missing)))) && Array.isArray(s.messages) && s.messages.every(m=>m && typeof m.text==='string' && ['tutor','student'].includes(m.role)) && Array.isArray(s.drafts) && s.drafts.length===5 && s.drafts.every(d=>typeof d==='string') && ['clerk','intern','resident'].includes(s.level) && ['light','medium','strong'].includes(s.intensity);
  }
  root.LinghuEngine={analyze,getGroups,registerCase,createSession,metrics,validSession,stateLabels};
})(typeof globalThis!=='undefined'?globalThis:window);
