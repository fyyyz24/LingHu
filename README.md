<div align="center">
  <img src="dist/assets/linghu-logo.png" width="125" alt="灵葫 Logo" />
  <h1>灵葫 · LingHu</h1>
  <p><b>基于 Hulu-Med 的临床思维训练教学模型</b></p>
  <p>分层启发式带教 · 多模态病例 · 循证反馈 · 全过程评价</p>
  <p><a href="docs/RUNNING.md">运行指引</a> · <a href="submission/README.md">参赛材料</a> · <a href="docs/TRAINING_PLAN.md">训练方案</a> · <a href="https://github.com/ZJUI-AI4H/Hulu-Med">Hulu-Med</a></p>
</div>

## 🧑🏻‍🏫 Background

灵葫面向见习、实习与住培教学，将“问诊—查体—辅助检查—鉴别诊断—治疗决策”组织为循序渐进的临床思维训练，帮助学生解释判断依据，帮助教师复盘学习过程。

## 🌟 Primary Features

- **多模态病例库**：图文协同呈现，支持病例 JSON + 本地图片上传、预览、入库与备份。
- **分层启发式教学**：按学习层级组织追问、要点提示与阶段推进。
- **循证反馈**：关联公开文献、来源定位与引用导出。
- **教师评价**：五阶段雷达、四维看板、逐轮训练轨迹与回放。

## ⚙️ Quick Start

```bash
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 **http://127.0.0.1:4173/**，也可直接双击 `dist/index.html`。应用无第三方前端运行依赖。

## 📦 Datasets

[教学种子集](datasets/README.md)：6 个教学编排病例，90 条分层任务；按病例划分为训练 45、验证 15、测试 30 条。公开参考图单独登记许可，不作为对应患者的真实配对训练图。

数据工坊 → 选择病例 JSON / 填入示例 → **上传本地图片** → 校验 → 确认导入。也可使用[预置带胸片示例](dist/examples/TEACHING-IMPORT-01-IMAGE.json)。

## 🧩 Training Preparation

```bash
node scripts/build-materials.cjs
node scripts/validate-materials.cjs
npm test
python scripts/package-submission.py
```

参见 [技术说明](docs/TECHNICAL.md)、[知识产权与脱敏清单](submission/IP_AND_PRIVACY.md)、[真实训练与录屏方案](docs/TRAINING_PLAN.md)。

> 当前发布教学应用、数据准备与复现工具；网页使用本地教学规则引擎，尚未接入 Hulu-Med 推理或完成模型微调。样例待临床教师审核，不用于诊疗；基础模型论文指标不属于本项目实测结果。
