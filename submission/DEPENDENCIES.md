# 依赖与运行产物

| 部分 | 依赖 | 随包提供 |
|---|---|---|
| 教学应用 | 原生 HTML/CSS/JS、localStorage | dist 全部应用文件，无 CDN/第三方运行库 |
| 数据构建/校验 | Node.js 18+ 内置 fs/path/vm/crypto/assert/child_process | 脚本；Node 运行时本机安装 |
| 服务/打包 | Python 3.10+ 标准库 | 脚本；Python 运行时本机安装 |
| 模型训练 | 未执行；拟用上游对应 PyTorch/Transformers/PEFT | 无权重、无未经执行的依赖锁定 |

不需要 npm install / pip install。package.json 仅定义本地脚本，无第三方依赖。dist 即必要运行产物，无独立编译二进制。运行时安装包不复制入仓库。

实际校验的 Node 版本与平台见 validation-report.json。模型训练执行后须保存 pip freeze、CUDA/驱动、上游 commit 与权重 revision，不能从模板项目复制。
