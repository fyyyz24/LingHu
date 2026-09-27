// Public teaching references are not a clinical record of the simulated patient.
const caseResources = [
  {
    context:'先描述胸片征象，再结合呼吸困难、查体和超声判断胸膜腔病变。公开参考图用于学习形态，不替代本教学病例的实际检查。',
    points:['观察患侧透亮度、肋膈角与纵隔位置。','积液影像不能直接确定感染、恶性或其他病因；仍需临床与检验信息。'],
    references:[{title:'BTS 胸膜疾病指南（2023）',publisher:'British Thoracic Society',section:'单侧胸腔积液评估与胸膜操作',url:'https://www.brit-thoracic.org.uk/clinical-resources/guidelines/pleural-disease/'}],
    assets:[{label:'胸片',src:'./assets/references/pleural-effusion.png',alt:'公开右侧胸腔积液胸片',role:'同病种参考 · 非本病例原片',caption:'右侧胸腔积液胸片。用于观察单侧积液相关影像征象。',limit:'原来源未给出积液量或病因，不能据此标注“大量”“恶性”或直接套用于本病例。',author:'James Heilman, MD',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:Effusion.png',remoteUrl:'https://upload.wikimedia.org/wikipedia/commons/f/ff/Effusion.png'}]
  },
  {
    context:'从分布、密度和伴随征象描述双肺异常；相似影像可见于不同疾病，应结合宿主背景和病原学信息。',
    points:['磨玻璃影叠加小叶间隔增厚可形成铺路石样表现。','CT 不能单独判定病原，也不能仅凭“缺少结节”排除 CMV 等感染。'],
    references:[{title:'ESR / ESTI 胸部影像建议（2020）',publisher:'European Society of Radiology / ESTI',section:'COVID-19 的 CT 影像特征；仅作形态教学参考',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7170031/'}],
    assets:[{label:'胸部 CT',src:'./assets/references/viral-pneumonia.webp',alt:'COVID-19肺炎铺路石样改变CT参考图',role:'同类影像参考 · 非病原确诊',caption:'公开 COVID-19 肺炎 CT：斑片状异常伴小叶间隔增厚，呈铺路石样改变。',limit:'不是本患者的 CT，不据图确认病原或严重程度；2020 年来源仅用于影像形态教学。',author:'Jin Y.、Cai L.、Cheng Z. 等（2020）；Jmarchn 裁切版',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:COVID19CT2.webp',remoteUrl:'https://upload.wikimedia.org/wikipedia/commons/5/56/COVID19CT2.webp'}]
  },
  {
    context:'将冠脉钙化的解剖位置、范围和总体风险联系起来，区分钙化负荷、管腔狭窄与心肌缺血三个概念。',
    points:['参考图的轴位 CT 与软件叠加图用于识别冠脉钙化位置。','单张静态图不能计算完整 Agatston 总分，也不能直接判断狭窄程度或缺血。'],
    references:[{title:'心脏 CT 钙化评分',publisher:'RadiologyInfo · ACR / RSNA',section:'检查用途、结果及局限',url:'https://www.radiologyinfo.org/en/info/ct_calscoring'}],
    assets:[{label:'冠脉 CT',src:'./assets/references/coronary-calcium.png',alt:'冠状动脉钙化轴位CT与识别叠加参考图',role:'钙化形态参考 · 非本病例原片',caption:'左为轴位 CT，右为钙化识别叠加图；原图箭头示前室间支（左前降支）钙化。',limit:'来源为另一研究队列；不据此给本病例赋予钙化积分、狭窄比例或缺血诊断。',author:'Philipp Fervers、Jonathan Kottlors、Nils Große Hokamp 等（2021）',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',sourceUrl:'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0255045',remoteUrl:'https://journals.plos.org/plosone/article/figure/image?id=10.1371%2Fjournal.pone.0255045.g001&size=inline'}]
  },
  {
    context:'本教学病例以肠壁增厚和腹痛为线索。增加结肠炎影像作为鉴别学习资料，不将参考病例病因写入当前患者病史。',
    points:['按部位、长度、对称性及周围改变描述肠壁异常。','肠壁增厚并非单一病因诊断；影像、临床表现与必要的内镜资料需要综合解释。'],
    references:[{title:'缺血性结肠炎的诊断与治疗',publisher:'Mayo Clinic',section:'诊断检查：影像、内镜及鉴别',url:'https://www.mayoclinic.org/diseases-conditions/ischemic-colitis/diagnosis-treatment/drc-20374005'}],
    assets:[{label:'腹部 CT',src:'./assets/references/colitis.jpg',alt:'公开缺血性结肠炎腹部CT参考影像',role:'结肠炎鉴别参考 · 非本病例原片',caption:'公开缺血性结肠炎 CT；源病例以横结肠受累为主并经内镜证实。',limit:'不能据参考图将本教学患者确诊缺血性结肠炎；原病例的部位和病程不能直接移植。',author:'Hellerhoff',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:Ischaemische_Colitis_67W_-_CT_-_001.jpg',remoteUrl:'https://upload.wikimedia.org/wikipedia/commons/7/79/Ischaemische_Colitis_67W_-_CT_-_001.jpg'}]
  },
  {
    context:'将皮肤、瘢痕、关节活动度和家族史作为组合表型观察。此病例的主要可视资料是体征照片，而非不适用的胸片或病理图。',
    points:['A 展示皮肤过伸，B 展示手指关节活动度增大；照片不能替代标准化全身关节评估。','经典型 EDS 的分型确认需结合临床评估与遗传检测；该源病例未进行分子检测。'],
    references:[{title:'经典型 Ehlers-Danlos 综合征（cEDS）',publisher:'The Ehlers-Danlos Society',section:'主要表型与诊断方法',url:'https://www.ehlers-danlos.com/ceds/'}],
    assets:[{label:'皮肤 / 关节体征',src:'./assets/references/eds-signs.png',alt:'EDS患者皮肤过伸和手指关节过伸的公开体征照片',role:'体征教学参考 · 非本病例照片',caption:'经典型 EDS 公开病例：A 为皮肤过度伸展，B 为手指关节活动度增大。源病例为临床诊断。',limit:'源患者拒绝分子检测，不能标为基因确诊；也不能单凭照片诊断本教学患者。',author:'John K Whitaker、Philip Alexander、David YS Chau、Naing L Tint（2012）',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',sourceUrl:'https://commons.wikimedia.org/wiki/File:Hyperelastic_skin_%26_hypermobile_finger_in_a_case_of_Ehlers-Danlos_syndrome.png',remoteUrl:'https://upload.wikimedia.org/wikipedia/commons/5/53/Hyperelastic_skin_%26_hypermobile_finger_in_a_case_of_Ehlers-Danlos_syndrome.png'}]
  },
  {
    context:'意识丧失伴呼吸异常首先是生命支持问题。头颅 CT 仅作为颅内事件鉴别学习资料，不让影像取代 ABC 与可逆病因检查。',
    points:['当前患者并未因参考图而确诊出血；仍需并行评估血糖、药物、外伤和神经系统线索。','短暂意识丧失指南适用于其规定人群；持续无反应伴呼吸异常不能按普通晕厥处理。'],
    references:[{title:'短暂意识丧失评估 · CG109',publisher:'NICE',section:'初步评估、事件经过、心电图；注意适用人群',url:'https://www.nice.org.uk/guidance/cg109/chapter/Recommendations'},{title:'头部损伤评估 · NG232',publisher:'NICE',section:'头伤后的影像指征；不能外推到所有无外伤晕厥',url:'https://www.nice.org.uk/guidance/ng232/chapter/recommendations'}],
    assets:[{label:'头颅 CT',src:'./assets/references/subdural.jpg',alt:'公开外伤性硬膜下出血头颅CT鉴别参考',role:'颅内事件鉴别 · 不代表本例诊断',caption:'外伤性硬膜下出血 CT 公开影像，用于认识意识障碍鉴别中的颅内结构性病变。',limit:'不是本患者原片，不说明本病例一定有外伤、出血或卒中，也不能排除代谢或药物原因。',author:'Glitzy queen00（原上传者）',license:'Public domain · PD-medical',licenseUrl:'https://commons.wikimedia.org/wiki/File:Trauma_subdural.jpg#Licensing',sourceUrl:'https://commons.wikimedia.org/wiki/File:Trauma_subdural.jpg',remoteUrl:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Trauma_subdural.jpg'}]
  }
];
