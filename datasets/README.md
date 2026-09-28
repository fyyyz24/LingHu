# LingHu Teaching Seed v1 · 数据说明卡

## 用途与规模

用于教学行为适配的**文本种子集**及评测流程联调，不是采集的真实病历，也不是 Hulu-Med 原始训练数据。由现有六例教学编排按五阶段、三学习层级确定性展开，共 90 条任务；不等于 90 位患者或 90 个独立病例。所有样本 `clinical_review=pending`。

| 文件 | 病例 | 样本 | 使用约束 |
|---|---|---:|---|
| train.jsonl | CASE 01–03 | 45 | 训练候选，医学内容先审核 |
| validation.jsonl | CASE 04 | 15 | 调参与早停候选 |
| test.jsonl | CASE 05–06 | 30 | 冻结留出题，不参与训练或调参 |

按病例划分，不把同一病例的阶段或层级变体跨集合混放。测试仅两个病例，不能支撑临床有效性、泛化或统计显著性的结论。所有题目公开且在网站可见，不构成盲测，也无法排除基础模型预训练污染。后续应由医生新增独立、未展示病例重新分组。

## 字段

- `id / case_id / split / stage / level`：稳定标识及分组。
- `messages`：system、user、assistant；assistant 是按层级组织的追问式教学目标，**不是隐藏思维链**。当前为教师主动追问样本，不含真实学生多轮作答；不能宣称已覆盖自动纠错或完整多轮 SFT。
- `facts_available`：当前阶段允许的教学资料，不把未来检查结果当作已知事实。
- `source / references`：源文件、病例位置及学习资料索引，**不等于逐句医学论证**。
- `clinical_review / data_origin / rights_status`：未审核、教学编排、需项目方确认权利。

训练仅使用 train，使用 assistant-only loss。评测必须剥离最后一条 assistant（参考目标）再向模型发送请求；`eval-prompts.jsonl` 已完成剥离。测试参考见 `eval-reference.jsonl`，不要给被测模型。不把来源元数据当成模型已核实的医学依据。

## 图片与版权

JSONL 不包含影像—患者配对。网页六张公开图片属于**同病种/鉴别参考**，不能与虚拟病例拼接后声称真实多模态训练集。授权清单见 `assets-manifest.json` 与 `../submission/THIRD_PARTY_NOTICES.md`。没有复制指南正文或受限原始数据集。

教学文字来自现有仓库编排而非医院导出。项目方需确认使用权，临床教师需签署审阅；本数据卡不替代授权书、伦理审批或第三方许可。未完成前仅作工程准备和教学展示候选。

## 复现与质量

`node scripts/build-materials.cjs` 从应用资料导出；`node scripts/validate-materials.cjs` 校验样本数、id、病例隔离、评测输入无参考目标、图片哈希及导入恢复。`submission/validation-report.json` 是实际结构/功能验证结果，**不是模型评测分数**。

医学质量、现实代表性、医生一致性以及模型输出安全性均未验证。明确存在缺失信息与需要调整的参考答案，例如积液量不能由当前参考图推出。医生审核请从 `submission/CLINICAL_REVIEW.csv` 开始，每行记录意见与日期后重新生成版本。
