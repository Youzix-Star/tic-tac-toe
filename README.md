# PureCard UI · 井字棋

一款拥有丝滑 UI 和三种模式（双人对战 / 人机对战 / 联机对战）的井字棋游戏，已模块化拆分，联机功能基于 Cloudflare Workers + Durable Objects。

## 功能特点
- 双人对战模式
- 人机对战模式（AI 基于简单阻挡 + 随机策略）
- 联机对战模式（房间号匹配，实时 WebSocket 通信）
- 美观的滑动胶囊切换模式 / 玩家指示器
- 胜利高亮 + 平局提示
- 响应式设计，适配手机与 PC

## 本地运行
直接打开 `index.html` 或使用本地服务器（如 Live Server）。注意联机模式需要部署后端 Worker 才能使用。

## 部署到 Cloudflare

### 前端部署（Pages）
1. 将代码推送到 GitHub 仓库。
2. 登录 Cloudflare Pages，连接该仓库。
3. 构建命令留空，输出目录填写 `/`。
4. 部署完成后获得 `xxx.pages.dev` 地址。

### 后端部署（Worker）
1. 安装 Wrangler：`npm install -g wrangler`
2. 进入 `backend` 目录，运行 `wrangler login`
3. 运行 `wrangler deploy` 部署 Worker
4. 记下部署后的 Worker 域名（如 `tictactoe-online.workers.dev`）
5. **重要**：修改前端 `js/onlineManager.js` 中的 `getApiBase()` 和 `getWsBase()` 方法，将域名改为你的 Worker 域名（或配置 Pages Functions 代理）。

## 项目结构
详见仓库。

## 未来计划
- 房间列表、观战功能
- 更高级 AI（极小极大算法）
- 断线重连
