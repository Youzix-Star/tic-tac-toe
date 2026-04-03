import { checkGameStatus, makeMove } from './gameLogic.js';
import { getBestAIMove } from './ai.js';
import { UIManager } from './uiManager.js';
import { OnlineManager } from './onlineManager.js';

// ---------- 游戏状态 ----------
let board = Array(9).fill(null);
let isXTurn = true;
let gameActive = true;
let winnerCombo = null;
let gameMode = 'twoPlayer';   // 'twoPlayer', 'vsAI', 'online'
let aiTimer = null;
let onlineManager = null;
let localPlayerRole = null;   // 联机模式下当前玩家的角色 'X' 或 'O'

const ui = new UIManager();

// 辅助函数
function clearAITimer() {
    if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
    }
}

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
    } else if (gameMode === 'twoPlayer') {
        ui.setStatusMessage(`🎲 轮到 ${currentPlayer} 落子`);
    } else if (gameMode === 'online') {
        if (!gameActive) return;
        if (localPlayerRole === currentPlayer) {
            ui.setStatusMessage(`🎲 轮到你了 (${currentPlayer})`);
        } else {
            ui.setStatusMessage(`⏳ 等待对手落子 ...`);
        }
    }
}

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
        } else if (gameMode === 'twoPlayer') {
            msg = `🏆 玩家 ${winnerSymbol} 获胜！ 🏆`;
        } else if (gameMode === 'online') {
            if (winnerSymbol === localPlayerRole) msg = '🎉 你赢了！ 🎉';
            else if (winnerSymbol === 'draw') msg = '🤝 平局！';
            else msg = '😭 你输了 ... 再来一局？';
        }
        ui.setStatusMessage(msg);
        ui.updatePlayerSlider(winnerSymbol);
    } else if (status.type === 'draw') {
        ui.setStatusMessage('🤝 平局！ 势均力敌 🤝');
    }
    ui.setGameActive(false);
}

// 本地落子（不通过网络发送，用于双人/人机）
function tryLocalMove(index, playerSymbol) {
    if (!gameActive) return false;
    if ((playerSymbol === 'X' && !isXTurn) || (playerSymbol === 'O' && isXTurn)) return false;
    if (!makeMove(board, index, playerSymbol)) return false;

    ui.updateBoardUI(board);
    ui.animateCell(index);

    const status = checkGameStatus(board);
    if (status.type !== 'continue') {
        handleGameEnd(status);
        return true;
    }

    isXTurn = !isXTurn;
    updateUIForState();
    return true;
}

// 联机模式：应用对手移动（直接更新状态，不发送网络消息）
function applyOpponentMove(index, player) {
    if (!gameActive) return;
    // 验证合法性
    if (board[index] !== null) return;
    if (player !== (isXTurn ? 'X' : 'O')) {
        // 回合不匹配，可能因网络延迟忽略
        console.warn('对手移动回合错误', player, isXTurn);
        return;
    }
    makeMove(board, index, player);
    ui.updateBoardUI(board);
    ui.animateCell(index);

    const status = checkGameStatus(board);
    if (status.type !== 'continue') {
        handleGameEnd(status);
        return;
    }

    isXTurn = !isXTurn;
    updateUIForState();
}

// 联机模式：本地玩家落子并发送
function tryOnlineMove(index) {
    if (!gameActive) return false;
    const currentPlayer = isXTurn ? 'X' : 'O';
    if (currentPlayer !== localPlayerRole) return false;
    if (!makeMove(board, index, currentPlayer)) return false;

    ui.updateBoardUI(board);
    ui.animateCell(index);

    const status = checkGameStatus(board);
    if (status.type !== 'continue') {
        handleGameEnd(status);
        onlineManager.sendMove(index); // 仍然发送最后一步
        return true;
    }

    isXTurn = !isXTurn;
    updateUIForState();
    // 发送移动到服务器
    onlineManager.sendMove(index);
    return true;
}

// AI 落子（人机模式）
function aiMove() {
    clearAITimer();
    if (!gameActive || gameMode !== 'vsAI' || isXTurn === true) return;
    const aiIndex = getBestAIMove(board, 'O', 'X');
    if (aiIndex !== -1 && board[aiIndex] === null) {
        tryLocalMove(aiIndex, 'O');
    }
}

function triggerAIMove() {
    if (gameMode !== 'vsAI') return;
    if (!gameActive) return;
    if (isXTurn === true) return;
    clearAITimer();
    aiTimer = setTimeout(() => aiMove(), 50);
}

// 重置本地游戏（双人/人机模式）
function resetLocalGame(aiFirst = false) {
    clearAITimer();
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
    } else if (gameMode === 'vsAI') {
        if (aiFirst) {
            isXTurn = false;
            ui.setStatusMessage('🤖 AI 先手 (O) · 轮到AI思考');
            ui.updatePlayerSlider('O');
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

// 联机模式重置（由后端广播触发）
function resetOnlineGame() {
    board.fill(null);
    gameActive = true;
    winnerCombo = null;
    isXTurn = true;  // X 总是先手
    ui.clearHighlights();
    ui.updateBoardUI(board);
    ui.setGameActive(true);
    ui.updatePlayerSlider('X');
    ui.setStatusMessage(`🔄 游戏已重置，X 先手 (你是 ${localPlayerRole})`);
}

// 重置入口（根据模式不同行为）
function resetGame(aiFirst = false) {
    if (gameMode === 'online') {
        if (onlineManager && onlineManager.isConnected) {
            onlineManager.sendReset();
        } else {
            ui.setStatusMessage('未连接，无法重置');
        }
    } else {
        resetLocalGame(aiFirst);
    }
}

// 切换模式
function setGameMode(mode) {
    if (mode === gameMode) return;
    // 清理联机资源
    if (onlineManager) {
        onlineManager.disconnect();
        onlineManager = null;
    }
    gameMode = mode;
    ui.updateModeSlider(mode);
    ui.setAIButtonVisible(mode === 'vsAI');
    const onlinePanel = document.getElementById('onlinePanel');
    if (onlinePanel) {
        onlinePanel.style.display = mode === 'online' ? 'block' : 'none';
    }
    if (mode === 'online') {
        // 联机模式不自动重置，等待用户操作
        board.fill(null);
        gameActive = false;
        ui.setGameActive(false);
        ui.updateBoardUI(board);
        ui.setStatusMessage('请创建或加入房间');
        localPlayerRole = null;
    } else {
        resetLocalGame(false);
    }
}

// 点击格子
function onCellClick(index) {
    if (!gameActive) return;
    if (gameMode === 'twoPlayer') {
        const currentPlayer = isXTurn ? 'X' : 'O';
        tryLocalMove(index, currentPlayer);
    } else if (gameMode === 'vsAI') {
        if (isXTurn === true && board[index] === null) {
            if (tryLocalMove(index, 'X')) triggerAIMove();
        }
    } else if (gameMode === 'online') {
        tryOnlineMove(index);
    }
}

// 初始化联机面板与事件
function initOnlineMode() {
    const createBtn = document.getElementById('onlineCreateBtn');
    const joinBtn = document.getElementById('onlineJoinBtn');
    const roomIdInput = document.getElementById('onlineRoomId');
    const roomDisplay = document.getElementById('onlineRoomDisplay');
    const statusSpan = document.getElementById('onlineStatus');

    if (!createBtn || !joinBtn) return;

    const createOnlineManager = () => {
        if (onlineManager) onlineManager.disconnect();
        onlineManager = new OnlineManager(
            (role) => { // onGameStart
                localPlayerRole = role;
                gameActive = true;
                isXTurn = true;
                board.fill(null);
                ui.updateBoardUI(board);
                ui.clearHighlights();
                ui.setGameActive(true);
                ui.updatePlayerSlider('X');
                ui.setStatusMessage(`游戏开始！你是 ${role}，X 先手`);
                statusSpan.innerText = `游戏中，你是 ${role}`;
                roomDisplay.innerText = `房间号: ${onlineManager.roomId}`;
            },
            (index, player) => { /* 可选：本地移动回调 */ },
            (index, player) => { // onOpponentMove
                applyOpponentMove(index, player);
            },
            (winner, reason) => { // onGameEnd
                gameActive = false;
                ui.setGameActive(false);
                if (winner === 'draw') ui.setStatusMessage('🤝 平局！');
                else if (winner === localPlayerRole) ui.setStatusMessage('🎉 你赢了！ 🎉');
                else ui.setStatusMessage('😭 你输了 ...');
                statusSpan.innerText = `游戏结束，${winner === 'draw' ? '平局' : (winner === localPlayerRole ? '胜利' : '失败')}`;
            },
            () => { // onReset
                resetOnlineGame();
                statusSpan.innerText = `游戏已重置，你是 ${localPlayerRole}`;
            },
            (err) => {
                ui.setStatusMessage(`错误: ${err}`);
                statusSpan.innerText = `错误: ${err}`;
            }
        );
    };

    createBtn.onclick = async () => {
        createOnlineManager();
        const roomId = await onlineManager.createRoom();
        if (roomId) {
            roomDisplay.innerText = `房间号: ${roomId}`;
            statusSpan.innerText = '等待对手加入...';
            ui.setStatusMessage('等待对手加入...');
        } else {
            statusSpan.innerText = '创建失败';
        }
    };

    joinBtn.onclick = async () => {
        const roomId = roomIdInput.value.trim();
        if (!roomId) return;
        createOnlineManager();
        const success = await onlineManager.joinRoom(roomId);
        if (success) {
            roomDisplay.innerText = `房间号: ${roomId}`;
            statusSpan.innerText = '已加入房间，等待开始...';
            ui.setStatusMessage('已加入房间，等待对手...');
        } else {
            statusSpan.innerText = '加入失败，房间不存在或已满';
        }
    };
}

// 初始化
function init() {
    ui.createBoard(onCellClick);
    ui.bindReset(() => resetGame(false));
    ui.bindAIFirst(() => { if (gameMode === 'vsAI') resetGame(true); });

    // 模式切换监听
    document.querySelectorAll('.mode-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = opt.getAttribute('data-mode');
            setGameMode(mode);
        });
    });

    // 添加联机面板到 DOM
    const onlinePanel = document.createElement('div');
    onlinePanel.id = 'onlinePanel';
    onlinePanel.style.display = 'none';
    onlinePanel.innerHTML = `
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="text" id="onlineRoomId" placeholder="输入房间号" style="flex:1; padding: 8px 12px; border-radius: 40px; border: 1px solid #dadce0;">
            <button id="onlineJoinBtn" class="reset-btn">加入房间</button>
            <button id="onlineCreateBtn" class="reset-btn">创建房间</button>
        </div>
        <div id="onlineRoomDisplay" style="font-size:0.9rem; color:#1a73e8;"></div>
        <div id="onlineStatus" style="font-size:0.8rem; color:#5f6368;"></div>
    `;
    document.querySelector('.game-container').appendChild(onlinePanel);
    initOnlineMode();

    setGameMode('twoPlayer');
}

init();
