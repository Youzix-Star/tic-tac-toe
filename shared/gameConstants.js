// 前后端共用常量（便于未来扩展联机）
export const PLAYER_X = 'X';
export const PLAYER_O = 'O';

export const WIN_PATTERNS = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

// 未来可用于房间、WebSocket 消息类型等
export const GAME_STATUS = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
};
