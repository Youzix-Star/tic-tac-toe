import { checkGameStatus, makeMove } from './gameLogic.js';
import { getBestAIMove } from './ai.js';
import { UIManager } from './uiManager.js';

// ---------- 游戏状态 ----------
let board = Array(9).fill(null);
let isXTurn = true;      // true = X, false = O
let gameActive = true;
let winnerCombo = null;
let gameMode = 'twoPlayer';   // 'twoPlayer' 或 'vsAI'
let aiTimer = null;

const ui = new UIManager();

// 辅助：清除 AI 延迟调用
function clearAITimer() {
    if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
    }
}

// 根据当前状态更新 UI（胶囊、状态文字）
function updateUIForState() {
    if (!gameActive) return;
    const currentPlayer = isXTurn ? 'X' : 'O';
    ui.updatePlayerSlider(currentPlayer);
    if (gameMode === 'vsAI') {
        if (!isXTurn) {
            ui.setStatusMessage('🤖 AI (O) 思考中 ...');
        } else {
            ui.setStatusMessage('🧑 轮到你了 (X)');
        }
    } else {
        ui.setStatusMessage(`🎲 轮到 ${currentPlayer} 落子`);
    }
}

// 处理游戏结束（胜利或平局）
function handleGameEnd(status) {
    gameActive = false;
    if (status.type === 'win') {
        winnerCombo = status.combo;
        ui.highlightWinner(winnerCombo);
        const winnerSymbol = status.winner;
        let msg = '';
        if (gameMode === 'vsAI') {
            if (winnerSymbol === 'X') msg = '🎉 恭喜你获胜！ 🎉';
            else msg = '🤖 AI 获胜了 ... 再来一局？';
        } else {
            msg = `🏆 玩家 ${winnerSymbol} 获胜！ 🏆`;
        }
        ui.setStatusMessage(msg);
        ui.updatePlayerSlider(winnerSymbol);
    } else if (status.type === 'draw') {
        ui.setStatusMessage('🤝 平局！ 势均力敌 🤝');
        // 平局时保持当前玩家胶囊不变（无所谓）
    }
    ui.setGameActive(false);
}

// 尝试落子（核心动作）
// 返回 true 表示落子成功且可能切换了回合，false 表示失败
function tryMove(index, playerSymbol) {
    if (!gameActive) return false;
    // 检查是否符合当前回合
    if ((playerSymbol === 'X' && !isXTurn) || (playerSymbol === 'O' && isXTurn)) return false;
    // 执行落子
    if (!makeMove(board, index, playerSymbol)) return false;

    // 更新界面
    ui.updateBoardUI(board);
    ui.animateCell(index);

    // 检查游戏状态
    const status = checkGameStatus(board);
    if (status.type !== 'continue') {
        handleGameEnd(status);
        return true;
    }

    // 切换回合
    isXTurn = !isXTurn;
    updateUIForState();
    return true;
}

// AI 落子逻辑
function aiMove() {
    clearAITimer();
    if (!gameActive || gameMode !== 'vsAI' || isXTurn === true) return;
    const aiIndex = getBestAIMove(board, 'O', 'X');
    if (aiIndex !== -1 && board[aiIndex] === null) {
        tryMove(aiIndex, 'O');
    }
}

// 触发 AI 落子（延迟，避免与玩家动画冲突）
function triggerAIMove() {
    if (gameMode !== 'vsAI') return;
    if (!gameActive) return;
    if (isXTurn === true) return;
    clearAITimer();
    aiTimer = setTimeout(() => aiMove(), 50);
}

// 重置游戏
function resetGame(aiFirst = false) {
    clearAITimer();
    // 重置棋盘数据
    board.fill(null);
    gameActive = true;
    winnerCombo = null;
    ui.clearHighlights();
    ui.updateBoardUI(board);
    ui.setGameActive(true);

    if (gameMode === 'twoPlayer') {
        isXTurn = true;
        ui.setStatusMessage('✨ 双人对局 · X 先手 ✨');
        ui.updatePlayerSlider('X');
    } else {
        if (aiFirst) {
            isXTurn = false;   // AI 先手（O）
            ui.setStatusMessage('🤖 AI 先手 (O) · 轮到AI思考');
            ui.updatePlayerSlider('O');
            // 延迟调用 AI 第一步
            setTimeout(() => {
                if (gameActive && gameMode === 'vsAI' && !isXTurn && board.every(v => v === null)) {
                    aiMove();
                }
            }, 80);
        } else {
            isXTurn = true;
            ui.setStatusMessage('🧑 你先手 (X) · 点击格子开始');
            ui.updatePlayerSlider('X');
        }
    }
    ui.refreshBoardAnimation();
}

// 切换游戏模式
function setGameMode(mode) {
    if (mode === gameMode) return;
    gameMode = mode;
    ui.updateModeSlider(mode);
    ui.setAIButtonVisible(mode === 'vsAI');
    resetGame(false);
}

// 点击格子事件
function onCellClick(index) {
    if (!gameActive) return;
    if (gameMode === 'twoPlayer') {
        const currentPlayer = isXTurn ? 'X' : 'O';
        if (tryMove(index, currentPlayer)) {
            // 双人模式不需要触发 AI
        }
    } else if (gameMode === 'vsAI') {
        if (isXTurn === true && board[index] === null) {
            if (tryMove(index, 'X')) {
                triggerAIMove();
            }
        }
    }
}

// 初始化：创建棋盘、绑定事件、默认状态
function init() {
    ui.createBoard(onCellClick);
    ui.bindReset(() => resetGame(false));
    ui.bindAIFirst(() => {
        if (gameMode === 'vsAI') resetGame(true);
    });

    // 模式切换监听
    document.querySelectorAll('.mode-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = opt.getAttribute('data-mode');
            setGameMode(mode);
        });
    });

    // 设置默认双人模式
    gameMode = 'twoPlayer';
    ui.updateModeSlider('twoPlayer');
    ui.setAIButtonVisible(false);
    resetGame(false);
}

// 启动
init();
