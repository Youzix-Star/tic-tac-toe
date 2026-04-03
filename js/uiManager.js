// UI 管理类：负责所有 DOM 操作、动画、胶囊切换等
export class UIManager {
    constructor() {
        this.boardContainer = document.getElementById('board');
        this.statusMsgDiv = document.getElementById('statusMsg');
        this.playerSlider = document.getElementById('playerSlider');
        this.modeSlider = document.getElementById('modeSlider');
        this.aiFirstBtn = document.getElementById('aiFirstBtn');
        this.resetBtn = document.getElementById('resetGameBtn');
        this.cells = [];
    }

    // 创建棋盘格子，绑定点击回调
    createBoard(onCellClick) {
        this.boardContainer.innerHTML = '';
        this.cells = [];
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-index', i);
            cell.addEventListener('click', () => onCellClick(i));
            this.boardContainer.appendChild(cell);
            this.cells.push(cell);
        }
    }

    // 根据棋盘数据更新所有格子显示
    updateBoardUI(board) {
        for (let i = 0; i < 9; i++) {
            const value = board[i];
            const cell = this.cells[i];
            cell.innerText = value || '';
            cell.setAttribute('data-value', value || '');
        }
    }

    // 清除所有高亮
    clearHighlights() {
        this.cells.forEach(cell => cell.classList.remove('winner-highlight'));
    }

    // 高亮胜利组合
    highlightWinner(combo) {
        if (combo) {
            combo.forEach(idx => {
                if (this.cells[idx]) this.cells[idx].classList.add('winner-highlight');
            });
        }
    }

    // 更新当前玩家胶囊（X/O）
    updatePlayerSlider(currentPlayerSymbol) {
        this.playerSlider.classList.remove('active-x', 'active-o');
        if (currentPlayerSymbol === 'X') this.playerSlider.classList.add('active-x');
        else if (currentPlayerSymbol === 'O') this.playerSlider.classList.add('active-o');
    }

    // 更新模式胶囊（双人/人机/联机）
    updateModeSlider(mode) {
        this.modeSlider.classList.remove('active-twoPlayer', 'active-vsAI', 'active-online');
        if (mode === 'twoPlayer') this.modeSlider.classList.add('active-twoPlayer');
        else if (mode === 'vsAI') this.modeSlider.classList.add('active-vsAI');
        else if (mode === 'online') this.modeSlider.classList.add('active-online');
    }

    // 设置状态栏消息
    setStatusMessage(msg) {
        this.statusMsgDiv.innerHTML = msg;
    }

    // 显示/隐藏 “AI先手” 按钮
    setAIButtonVisible(visible) {
        this.aiFirstBtn.style.display = visible ? 'inline-flex' : 'none';
    }

    // 激活/禁用游戏（禁用后格子不可点击）
    setGameActive(active) {
        if (active) this.boardContainer.classList.remove('inactive');
        else this.boardContainer.classList.add('inactive');
    }

    // 播放落子动画
    animateCell(index) {
        const cell = this.cells[index];
        if (cell) {
            cell.style.transform = 'scale(0.96)';
            setTimeout(() => { if(cell) cell.style.transform = ''; }, 100);
        }
    }

    // 刷新棋盘时的弹出动画
    refreshBoardAnimation() {
        this.boardContainer.classList.add('board-refresh');
        setTimeout(() => this.boardContainer.classList.remove('board-refresh'), 200);
    }

    // 绑定重置按钮事件
    bindReset(callback) {
        this.resetBtn.addEventListener('click', callback);
    }

    // 绑定 AI 先手按钮事件
    bindAIFirst(callback) {
        this.aiFirstBtn.addEventListener('click', callback);
    }
}
