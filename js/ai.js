import { checkWin } from './gameLogic.js';

/**
 * 获取 AI 的最佳落子位置
 * @param {Array} board - 当前棋盘
 * @param {string} aiPlayer - AI 使用的棋子，默认 'O'
 * @param {string} humanPlayer - 玩家棋子，默认 'X'
 * @returns {number} 落子索引，-1 表示无位置
 */
export function getBestAIMove(board, aiPlayer = 'O', humanPlayer = 'X') {
    // 1. AI 直接获胜
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            const sim = [...board];
            sim[i] = aiPlayer;
            if (checkWin(sim, aiPlayer)) return i;
        }
    }
    // 2. 阻挡玩家获胜
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            const sim = [...board];
            sim[i] = humanPlayer;
            if (checkWin(sim, humanPlayer)) return i;
        }
    }
    // 3. 占中心
    if (board[4] === null) return 4;
    // 4. 随机角
    const corners = [0,2,6,8];
    const availableCorners = corners.filter(idx => board[idx] === null);
    if (availableCorners.length) return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    // 5. 任意空位
    const empty = board.reduce((arr, val, idx) => {
        if (val === null) arr.push(idx);
        return arr;
    }, []);
    if (empty.length === 0) return -1;
    return empty[Math.floor(Math.random() * empty.length)];
}
