# PureCard UI · 井字棋

一款拥有丝滑 UI 和双模式（双人对战 / 人机对战）的井字棋游戏，已模块化拆分，便于维护和未来扩展联机功能。

## 功能特点
- 双人对战模式
- 人机对战模式（AI 基于简单阻挡 + 随机策略）
- 美观的滑动胶囊切换模式 / 玩家指示器
- 胜利高亮 + 平局提示
- 响应式设计，适配手机与 PC

## 本地运行
直接打开 `index.html` 或使用本地服务器（如 Live Server）。

## 项目结构
```

tic-tac-toe/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── gameLogic.js   # 核心规则
│   ├── ai.js          # AI 算法
│   ├── uiManager.js   # UI 操作
│   └── main.js        # 主控制器
├── shared/            # 前后端共用常量（联机预留）
└── backend/           # 未来后端代码（Cloudflare Workers）

```

## 部署到 Cloudflare Pages
1. 将代码推送到 GitHub 仓库。
2. 登录 Cloudflare Pages，连接该仓库。
3. 构建命令留空，输出目录填写 `/`。
4. 部署完成后获得 `xxx.pages.dev` 地址。

## 未来计划
- 联机对战（WebSocket + Cloudflare Durable Objects）
- 房间系统与观战功能
- 更高级 AI（极小极大算法）
