# Web3ToolBox 使用指南

## 快速开始

### 1. 安装

从 [Releases](https://github.com/web3ToolBoxDev/toolBoxClient/releases) 下载最新安装包。

### 2. 首次启动

1. 打开应用，等待自动初始化（首次启动会安装内部依赖）
2. 进入介绍页面，可查看视频指南、GitHub 链接

### 3. 初始配置（浏览器管理）

1. **安装浏览器** — 点击"安装浏览器"按钮，下载定制版 Chromium
2. **设置保存路径** — 选择数据存储目录（指纹、钱包、会话数据都存这里）

### 4. 启动 AI Agent（以 Job Seek 为例）

1. 侧边栏 → **AI Agents**
2. 点击 Job Seek AI Assistant 的 **Open Workspace**
3. 创建会话，完成引导设置（职位、地点、工作方式、简历上传）
4. 点击 **Start** 启动 Agent

### 5. Dashboard 配置

1. 登录招聘平台（LinkedIn / Indeed），在指纹浏览器中手动登录
2. 点击 **Build** 构建搜索工具
3. 点击 **Start Workflow** 启动自动化流程

---

## 开发模式

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| React 前端 | 3001 | Electron 开发模式（已避开微信代理占用的 3000） |
| Express 后端 | 30001 | API + WebSocket 服务 |
| Web Dashboard | 8081 | 独立浏览器模式（已避开 llm-gateway 占用的 8080） |
| Memory 服务 | 30002 | SQLite 结构化知识库 |
| Dashboard 服务 | 30003 | Agent 控制面板 |
| Tool 服务 | 30004 | 浏览器池、钱包工具等 |

### 启动命令

```bash
# 安装依赖
yarn install

# Electron 开发模式（自动启动后端 + React 前端）
yarn dev

# 仅 React 开发服务器（热更新）
yarn start
# → http://localhost:3001

# Web Dashboard 模式（纯浏览器，无需 Electron）
yarn web
# → http://localhost:8081

# 构建生产版本
yarn build
yarn dist    # 打包 Electron 分发版
```

### 测试

```bash
# 前端测试
npm run test

# 后端测试
npm run test:server

# 全部测试
npm run test:all

# E2E 测试
npm run test:e2e

# 回归测试
npm run test:regression
```

---

## 功能模块

### 浏览器管理（Chrome Manager）

| 功能 | 说明 |
|------|------|
| 安装浏览器 | 自动探测 bundled Chromium 路径 |
| 生成指纹 | 基于默认样本随机生成浏览器指纹 |
| 导入指纹 | 从 JSON 文件导入指纹基础数据 |
| 导出指纹 | 导出所有指纹环境为 JSON |
| 删除选中 | 批量删除指纹环境 |

### 钱包管理（Wallet Manage）

| 功能 | 说明 |
|------|------|
| 创建钱包 | 批量创建 ETH/SOL 钱包 |
| 删除钱包 | 批量删除选中钱包 |
| 初始化 | 链上初始化钱包 |
| 打开钱包 | 在浏览器环境中打开钱包 |

### 同步功能（Sync Function）

| 功能 | 说明 |
|------|------|
| 选择主环境 | 指定同步源浏览器环境 |
| 选择从环境 | 多选目标环境 |
| 启动同步 | 下发同步任务 |
| 停止同步 | 终止正在运行的任务 |
| 重试失败项 | 仅重试上次失败的环境 |
| 状态面板 | 实时显示每个环境的同步状态和日志 |

### AI Agents

| 功能 | 说明 |
|------|------|
| 查看任务 | 列出所有 AI 类型任务 |
| 运行任务 | 启动 AI Agent 任务 |

---

## API 参考

后端服务：`http://127.0.0.1:30001/api/`

### 浏览器管理

```
GET    /api/getFingerPrints          获取所有指纹
GET    /api/getFingerPrintCount      获取指纹数量
POST   /api/generateFingerPrints     生成指纹 { counts: number }
POST   /api/deleteFingerPrints       删除指纹 { ids: string[] }
POST   /api/exportFingerPrints       导出指纹 { filePath: string }
POST   /api/loadFingerPrints         导入指纹 { filePath: string }
POST   /api/runInstaller             安装浏览器
GET    /api/getChromePath            获取 Chrome 路径
POST   /api/setChromePath            设置 Chrome 路径
```

### 钱包管理

```
GET    /api/getAllWallets            获取所有钱包
POST   /api/createWallet             创建钱包 { count: number }
DELETE /api/deleteWallets            删除钱包 { ids: string[] }
POST   /api/updateWalletName         更新钱包名称 { id, name }
POST   /api/initWallets              初始化钱包 { ids: string[] }
POST   /api/openWallets              打开钱包 { ids: string[] }
```

### 任务管理

```
GET    /api/getAllTasks              获取所有任务
GET    /api/getAgentTasks            获取 AI 任务
POST   /api/execTask                 执行任务 { taskName, taskData }
DELETE /api/deleteTask               删除任务 { taskNames: string[] }
POST   /api/getTaskStatus            获取任务状态 { taskNames: string[] }
POST   /api/terminateTask            终止任务 { taskName: string }
```

---

## 项目结构

```
toolBoxClient/
├── client/                  # React 前端（Electron 模式）
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   │   ├── ChromeManager/   # 浏览器管理
│   │   │   ├── WalletManage/    # 钱包管理
│   │   │   ├── TaskManage/      # 任务管理
│   │   │   ├── SyncFunction/    # 同步功能
│   │   │   └── aiAgents/        # AI Agents
│   │   ├── store/           # Zustand 状态管理
│   │   ├── utils/           # 工具函数（API、i18n、事件）
│   │   └── router.js        # 前端路由
│   └── build/               # 构建输出
├── web/                     # Web 前端（独立浏览器模式）
│   ├── index.html           # 入口
│   ├── app.js               # SPA 逻辑
│   └── server.js            # Web 服务器（端口 8081）
├── server/                  # Express 后端
│   ├── server.js            # 主服务器（端口 30001）
│   ├── router.js            # API 路由
│   ├── services/            # 业务服务
│   │   ├── fingerPrintService.js
│   │   ├── taskService.js
│   │   ├── walletService.js
│   │   └── webSocketService.js
│   └── routes/              # 额外路由（stateRoutes）
├── config.js                # 全局配置（单例）
├── electron.js              # Electron 主进程
├── preload.js               # Electron 预加载脚本
├── assets/                  # 静态资源
│   ├── scripts/             # 自动化脚本
│   ├── fingerprint-chromium/ # 定制 Chromium
│   └── agents/              # Agent 配置
├── test/                    # 测试文件
└── docs/                    # 文档
```

---

## 常见问题

### 端口冲突

- **3000 被占用**：React 开发服务器已改为 3001
- **8080 被占用**：Web Dashboard 已改为 8081
- 可通过环境变量覆盖：`PORT=3002 npm start` / `WEB_PORT=8090 node web/server.js`

### 数据备份

数据库文件存储在用户配置的 savePath 目录下：
```
{savePath}/db/
├── walletData.db
├── fingerPrint.db
└── task.db
```

定期备份此目录即可保留所有数据。

### 双副本说明

项目存在两个副本：
- `/home/jimwong/projects/toolBoxClient` — 开发目录（git 仓库）
- `/home/jimwong/toolBoxClient` — 运行目录

开发时在 projects 目录修改，通过 `git pull` 同步到运行目录。
