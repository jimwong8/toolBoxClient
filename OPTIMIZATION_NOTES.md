# Web3ToolBox 优化记录

## 问题根因

项目原始环境是 Node.js 18/20 + ethers v5 + mem0ai v0.x（未发布到 npm）。
当前系统默认 Node.js v24 + ethers v6 + mem0ai v1.0.39，存在系统性不兼容。

## 修复内容

### 1. Node.js 版本管理

- 安装 Node.js v20.20.2 到 `~/.n/`（无需 sudo）
- 创建 `.nvmrc` 和 `.node-version` 锁定版本
- 启动脚本自动切换 PATH

```bash
# 手动切换
export PATH=$HOME/.n/bin:$PATH

# 或使用脚本
./scripts/dev.sh start
```

### 2. 依赖修复

| 包 | 问题 | 修复 |
|---|---|---|
| `@flashbots/ethers-provider-bundle@0.6.2` | 依赖 ethers v5 API (`JsonRpcProvider` 路径不同) | 升级到 `@1.0.0`（支持 ethers v6） |
| `@ethersproject/transactions` | 未安装（被 flashbots 依赖） | `npm install @ethersproject/transactions@^5.7.0 --legacy-peer-deps` |
| `mem0ai/oss` | v1.0.39 移除了 `Memory`、`EmbedderFactory`、`LLMFactory` | 创建本地 shim `dbservice/mem0ai-shim.js` |

### 3. mem0ai-shim 实现

文件：`dbservice/mem0ai-shim.js`

- `EmbedderFactory` / `LLMFactory`：存根，注入自定义实例
- `Memory`：**SQLite 真实后端**，通过 `knowledgeStore` 实现
  - `add()` — 存储消息到 SQLite
  - `search()` — BM25 全文搜索
  - `get()` / `getAll()` — 按 key/namespace 查询
  - `update()` / `delete()` / `deleteAll()` — 增删改
  - `history()` — 返回最近条目

### 4. 启动脚本

文件：`scripts/dev.sh`

```bash
./scripts/dev.sh start    # 启动后端（server + dbservice + toolService）
./scripts/dev.sh stop     # 停止所有服务
./scripts/dev.sh status   # 查看状态 + 健康检查
```

自动处理：
- Node 20 PATH 切换
- `IS_BUILD=false` 环境变量
- 端口占用检测
- HTTP 健康检查（30001/30002/30004）

### 5. npm scripts 新增

```bash
npm run dev:backend      # 启动完整后端（等同于 dev.sh start）
npm run dev:server       # 同上
npm run dev:dbservice    # 单独启动 DB 服务
npm run dev:toolservice  # 单独启动 Tool 服务
npm run dev:web          # 启动 Web Dashboard（浏览器模式）
```

## 目录结构变更

```
toolBoxClient/
├── .nvmrc                          # ← 新增：锁定 Node 20
├── .node-version                   # ← 新增：锁定 v20.20.2
├── scripts/
│   └── dev.sh                      # ← 新增：统一启动脚本
├── dbservice/
│   └── mem0ai-shim.js              # ← 新增：mem0ai 兼容层（SQLite 后端）
└── package.json                    # ← 修改：新增 dev:* scripts
```

## 已知限制

1. **Memory 无向量搜索**：shim 使用 BM25（SQLite FTS5），没有语义向量搜索
2. **BridgeLLM 未集成**：`LLMFactory.create('custom')` 需要外部注入实例
3. **Electron 桌面模式未测试**：修复仅针对后端（`IS_BUILD=false`），Electron 打包模式需要额外验证
4. **Node 20 需要手动 PATH**：系统默认仍是 Node 24，每次新终端需要 `export PATH=$HOME/.n/bin:$PATH`

## 验证

```bash
export PATH=$HOME/.n/bin:$PATH
cd /home/jimwong/projects/toolBoxClient

# 启动后端
./scripts/dev.sh start &

# 等待 6 秒后检查
sleep 6
./scripts/dev.sh status

# 测试 API
curl -s http://127.0.0.1:30001/api/getAllWallets | head -c 200
curl -s http://127.0.0.1:30002/health
curl -s http://127.0.0.1:30004/health

# 停止
./scripts/dev.sh stop
```

## 后续优化建议

- [ ] 将 Node 20 PATH 写入 `~/.bashrc` 或项目 `.env`
- [ ] 实现 BridgeLLM 注入（让 dbservice 真正能用 LLM）
- [ ] 添加向量搜索（pgvector 或 sqlite-vec）
- [ ] 测试 Electron 桌面模式
- [ ] 升级 mem0ai 到 v2.x/v3.x（需要重写 dbservice）
