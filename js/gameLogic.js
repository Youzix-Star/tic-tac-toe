// 胜利模式常量
export const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

// 检查某个玩家是否赢了（基于棋盘数组和玩家符号）
export function checkWin(board, player) {
    return winPatterns.some(pattern => pattern.every(idx => board[idx] === player));
}

// 检查游戏状态：'win', 'draw', 'continue'
export function checkGameStatus(board) {
    // 赢家判定
    for (const pattern of winPatterns) {
        const [a,b,c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { type: 'win', winner: board[a], combo: pattern };
        }
    }
    // 平局判定
    const isFull = board.every(cell => cell !== null);
    if (isFull) return { type: 'draw', winner: null, combo: null };
    return { type: 'continue', winner: null, combo: null };
}

// 检查落子是否合法
export function isValidMove(board, index) {
    return board[index] === null;
}

// 执行落子，返回是否成功
export function makeMove(board, index, player) {
    if (!isValidMove(board, index)) return false;
    board[index] = player;
    return true;
}
