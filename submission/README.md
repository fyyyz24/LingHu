# 参赛提交材料索引

本包依照用户提供的大模型赛道材料类别整理；未获取本届完整规则，**不保证已满足赛道全部验收要求**。交付为“应用代码 + 数据准备 + 复现及权利清单”，不是完整训练完成证明。

| 要求类别 | 已提供 | 尚需补充 |
|---|---|---|
| 训练用数据 | train 45 条，validation 15 条；数据卡/来源 | 临床审核、权利确认、扩大独立病例 |
| 评测数据 | test 30 条；无答案的 eval-prompts、参考目标、评价表 | 医生复核、独立盲测病例、真实模型输出 |
| 知识产权/脱敏 | IP_AND_PRIVACY、图像许可清单、哈希、检查项 | 必需的权利/伦理文件和负责人签字，不代签 |
| 应用源代码/产物 | dist 原生源代码暨静态运行产物、自动测试 | 若要求模型后端/权重，另行完成 |
| 依赖 | DEPENDENCIES.md，无第三方前端运行库 | 真实训练环境版本锁定 |
| 程序运行指引 | README、docs/RUNNING.md、技术说明 | 无 |
| 训练与模型评测 | 真实实验计划、空白评价表 | 日志、权重、留出题对比；均未执行 |

## 复现与打包

在仓库根目录依次运行：

```bash
node scripts/build-materials.cjs
node scripts/validate-materials.cjs
python scripts/package-submission.py
```

产物 `release/linghu-submission.zip`。包内 `MANIFEST.json` 含各文件字节数、SHA-256 及源 Git 修订信息；可验证完整性，不证明医学正确性或授权完备。不含 .git、.openai、账号配置、申报书、PPT、浏览器训练记录或未生成的权重。

validation-report.json 是本次实际结构校验与功能测试结果，不能作为大模型性能报告。CLINICAL_REVIEW.csv 和 MODEL_EVALUATION.csv 空白格等待真实审核与评测。重新构建不会覆盖已填写的审核/评价表。

提交前完成 IP_AND_PRIVACY.md 待办。如果赛道必须提交权重、真实数据授权或实测报告，当前包仍缺这些，应补齐后再作为最终参赛材料。
