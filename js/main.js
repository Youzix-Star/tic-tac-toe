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
function clearAITimer() { if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; } }

function updateUIForState() {
    if (!gameActive) return;
    const currentPlayer = isXTurn ? 'X' : 'O';
    ui.updatePlayerSlider(currentPlayer);
    if (gameMode === 'vsAI') {
        if (!isXTurn) ui.setStatusMessage('🤖 AI (O) 思考中 ...');
        else ui.setStatusMessage('🧑 轮到你了 (X)');
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
            msg = winnerSymbol === 'X' ? '🎉 恭喜你获胜！ 🎉' : '🤖 AI 获胜了 ... 再来一局？';
        } else if (gameMode === 'twoPlayer') {
            msg = `🏆 玩家 ${winnerSymbol} 获胜！ 🏆`;
        } else if (gameMode === 'online') {
            if (winnerSymbol === localPlayerRole) msg = '🎉 你赢了！ 🎉';
            else msg = '😭 你输了 ... 再来一局？';
        }
        ui.setStatusMessage(msg);
        ui.updatePlayerSlider(winnerSymbol);
    } else if (status.type === 'draw') {
        ui.setStatusMessage('🤝 平局！ 势均力敌 🤝');
    }
    ui.setGameActive(false);
}

// 尝试落子（本地）
function tryMove(index, playerSymbol, fromOnline = false) {
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

// AI 落子（人机模式）
function aiMove() { /* 与原代码相同 */ }
function triggerAIMove() { /* 与原代码相同 */ }

// 重置游戏
function resetGame(aiFirst = false) {
    clearAITimer();
    if (onlineManager) onlineManager.disconnect();
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
            setTimeout(() => { if (gameActive && gameMode === 'vsAI' && !isXTurn && board.every(v => v === null)) aiMove(); }, 80);
        } else {
            isXTurn = true;
            ui.setStatusMessage('🧑 你先手 (X) · 点击格子开始');
            ui.updatePlayerSlider('X');
        }
    } else if (gameMode === 'online') {
        // 联机模式重置由房间逻辑控制，这里只清空界面
        ui.setStatusMessage('等待联机对局开始...');
        ui.updatePlayerSlider('X'); // 占位
        isXTurn = true;
        localPlayerRole = null;
    }
    ui.refreshBoardAnimation();
}

// 切换模式
function setGameMode(mode) {
    if (mode === gameMode) return;
    gameMode = mode;
    ui.updateModeSlider(mode);
    ui.setAIButtonVisible(mode === 'vsAI');
    // 隐藏联机相关UI元素（稍后添加）
    document.getElementById('onlinePanel').style.display = mode === 'online' ? 'flex' : 'none';
    resetGame(false);
}

// 点击格子
function onCellClick(index) {
    if (!gameActive) return;
    if (gameMode === 'twoPlayer') {
        const currentPlayer = isXTurn ? 'X' : 'O';
        tryMove(index, currentPlayer);
    } else if (gameMode === 'vsAI') {
        if (isXTurn === true && board[index] === null) {
            if (tryMove(index, 'X')) triggerAIMove();
        }
    } else if (gameMode === 'online') {
        if (localPlayerRole === 'X' && isXTurn && board[index] === null) {
            if (tryMove(index, 'X')) {
                onlineManager.sendMove(index);
            }
        } else if (localPlayerRole === 'O' && !isXTurn && board[index] === null) {
            if (tryMove(index, 'O')) {
                onlineManager.sendMove(index);
            }
        }
    }
}

// 联机相关 UI 和逻辑
function initOnlineMode() {
    const createBtn = document.getElementById('onlineCreateBtn');
    const joinBtn = document.getElementById('onlineJoinBtn');
    const roomIdInput = document.getElementById('onlineRoomId');
    const roomDisplay = document.getElementById('onlineRoomDisplay');
    const statusSpan = document.getElementById('onlineStatus');

    createBtn.onclick = async () => {
        if (!onlineManager) onlineManager = new OnlineManager(
            (role) => { // onGameStart
                localPlayerRole = role;
                gameActive = true;
                isXTurn = true; // 总是 X 先手
                board.fill(null);
                ui.updateBoardUI(board);
                ui.clearHighlights();
                ui.setGameActive(true);
                updateUIForState();
                statusSpan.innerText = `游戏开始，你是 ${role}`;
                roomDisplay.innerText = `房间号: ${onlineManager.roomId}`;
            },
            (index) => { /* onMove 本地移动时已处理 */ },
            (index) => { // onOpponentMove
                const opponentSymbol = localPlayerRole === 'X' ? 'O' : 'X';
                tryMove(index, opponentSymbol, true);
            },
            (winner, reason) => { // onGameEnd
                gameActive = false;
                ui.setGameActive(false);
                if (winner === 'draw') ui.setStatusMessage('🤝 平局！');
                else if (winner === localPlayerRole) ui.setStatusMessage('🎉 你赢了！ 🎉');
                else ui.setStatusMessage('😭 你输了 ...');
            },
            (err) => { ui.setStatusMessage(`错误: ${err}`); }
        );
        const roomId = await onlineManager.createRoom();
        if (roomId) {
            roomDisplay.innerText = `房间号: ${roomId}`;
            statusSpan.innerText = '等待对手加入...';
        } else {
            statusSpan.innerText = '创建失败';
        }
    };

    joinBtn.onclick = async () => {
        const roomId = roomIdInput.value.trim();
        if (!roomId) return;
        if (!onlineManager) onlineManager = new OnlineManager(/* 同上回调 */);
        const success = await onlineManager.joinRoom(roomId);
        if (success) {
            roomDisplay.innerText = `房间号: ${roomId}`;
            statusSpan.innerText = '已加入房间，等待开始...';
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

    // 模式切换
    document.querySelectorAll('.mode-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = opt.getAttribute('data-mode');
            setGameMode(mode);
        });
    });

    // 添加联机面板到 DOM（稍后会在 HTML 中添加）
    const onlinePanel = document.createElement('div');
    onlinePanel.id = 'onlinePanel';
    onlinePanel.style.display = 'none';
    onlinePanel.innerHTML = `
        <div style="margin-top: 16px; padding: 12px; background: #f1f3f4; border-radius: 24px;">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <input type="text" id="onlineRoomId" placeholder="输入房间号" style="flex:1; padding: 8px 12px; border-radius: 40px; border: 1px solid #dadce0;">
                <button id="onlineJoinBtn" class="reset-btn">加入房间</button>
                <button id="onlineCreateBtn" class="reset-btn">创建房间</button>
            </div>
            <div id="onlineRoomDisplay" style="font-size:0.9rem; color:#1a73e8;"></div>
            <div id="onlineStatus" style="font-size:0.8rem; color:#5f6368;"></div>
        </div>
    `;
    document.querySelector('.game-container').appendChild(onlinePanel);
    initOnlineMode();

    setGameMode('twoPlayer');
}

init();
