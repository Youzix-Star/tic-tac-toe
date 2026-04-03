# 后端目录（预留联机功能）

未来可使用 Cloudflare Workers + Durable Objects 实现实时联机对战。

目录结构建议：
- `websocket-server.js` 或 `index.js` 处理房间与消息转发
- `game-room.js` 管理房间内游戏状态

具体实现待后续扩展。
