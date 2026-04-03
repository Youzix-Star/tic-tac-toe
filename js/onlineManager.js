// 联机管理器：负责 WebSocket 通信、房间管理
export class OnlineManager {
    constructor(onGameStart, onMove, onOpponentMove, onGameEnd, onError) {
        this.ws = null;
        this.roomId = null;
        this.playerRole = null; // 'X' 或 'O'
        this.onGameStart = onGameStart;
        this.onMove = onMove;       // 收到对手移动时回调 (index)
        this.onOpponentMove = onOpponentMove;
        this.onGameEnd = onGameEnd;
        this.onError = onError;
    }

    // 创建房间
    async createRoom(playerName = 'Player') {
        try {
            const resp = await fetch('/api/create', { method: 'POST' });
            const data = await resp.json();
            if (data.roomId) {
                this.roomId = data.roomId;
                await this.connectWebSocket(data.roomId, 'X', playerName);
                return data.roomId;
            } else {
                throw new Error('创建房间失败');
            }
        } catch (err) {
            this.onError?.(err.message);
            return null;
        }
    }

    // 加入房间
    async joinRoom(roomId, playerName = 'Player') {
        try {
            const resp = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId })
            });
            const data = await resp.json();
            if (data.success) {
                this.roomId = roomId;
                await this.connectWebSocket(roomId, 'O', playerName);
                return true;
            } else {
                throw new Error(data.error || '加入房间失败');
            }
        } catch (err) {
            this.onError?.(err.message);
            return false;
        }
    }

    // 建立 WebSocket 连接
    connectWebSocket(roomId, role, playerName) {
        return new Promise((resolve, reject) => {
            const wsUrl = `wss://${window.location.host}/api/ws?roomId=${roomId}&role=${role}&name=${encodeURIComponent(playerName)}`;
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                console.log('WebSocket 已连接');
                resolve();
            };
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this.handleMessage(msg);
            };
            this.ws.onerror = (err) => {
                console.error('WebSocket 错误', err);
                this.onError?.('连接失败，请重试');
                reject(err);
            };
            this.ws.onclose = () => {
                console.log('WebSocket 断开');
                this.onError?.('连接已断开');
            };
        });
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'game_start':
                this.playerRole = msg.role; // 'X' 或 'O'
                this.onGameStart?.(this.playerRole);
                break;
            case 'move':
                // 对手落子
                this.onOpponentMove?.(msg.index);
                break;
            case 'game_end':
                this.onGameEnd?.(msg.winner, msg.reason);
                break;
            case 'error':
                this.onError?.(msg.message);
                break;
            default:
                break;
        }
    }

    // 发送落子
    sendMove(index) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'move', index }));
        }
    }

    // 断开连接
    disconnect() {
        if (this.ws) this.ws.close();
    }
              }
