// ═══════════════════════════════════════════════════════════════════
// ARCADE X - TIC TAC TOE GAME CONTROLLER
// "Reference implementation — Orchestrates State + AI + UI + Audio"
// Scene-compatible: init(), destroy(), update(), render(), handleInput()
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class TicTacToeGame {
    constructor(gameSceneManager) {
        this.gsm = gameSceneManager;    // GameSceneManager ref (for backToLobby, audio)
        this.audio = gameSceneManager?.audio || null;

        // ── Subsystems ──
        this.state = new TicTacToeState();
        this.ui = new TicTacToeUI(this.state, this.audio);

        // ── DOM ──
        this.container = null;

        // ── Timing ──
        this._aiTimer = 0;
        this._resultDelay = 0;

        // ── Input debounce ──
        this._lastInputTime = 0;
        this._inputCooldown = 150; // ms

        // ── Bound methods ──
        this._onCellClick = this._onCellClick.bind(this);
        this._onBackBtn = this._onBackBtn.bind(this);
        this._onRestartBtn = this._onRestartBtn.bind(this);
        this._onPlayAgainBtn = this._onPlayAgainBtn.bind(this);
        this._onChangeModeBtn = this._onChangeModeBtn.bind(this);
        this._onBackLobbyBtn = this._onBackLobbyBtn.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onMenuOptionClick = this._onMenuOptionClick.bind(this);
    }

    // ════════════════════════════════════════════
    //  SCENE INTERFACE (called by SceneManager)
    // ════════════════════════════════════════════

    /**
     * Initialize the game scene.
     * @param {string|object} data - Game mode string or data object
     */
    init(data) {
        // Get the game scene container
        this.container = document.getElementById('game-scene');
        if (!this.container) {
            console.error('TicTacToe: #game-scene not found');
            return;
        }

        // Clear default game-scene content
        this.container.innerHTML = '';
        this.container.style.display = 'block';

        // Mount UI
        this.ui.mount(this.container);

        // Wire global keyboard
        document.addEventListener('keydown', this._onKeyDown);

        // Determine if a mode was pre-selected
        if (typeof data === 'string' && data !== 'single') {
            // Direct mode launch (e.g. from lobby quick-launch)
            this.state.mode = data;
            this._startGame();
        } else {
            // Show mode selection menu
            this._enterMenu();
        }

        console.log('TIC TAC TOE: Scene initialized');
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeyDown);
        this._unbindGameEvents();
        this.ui.destroy();
        this.state.destroy();
        console.log('TIC TAC TOE: Scene destroyed');
    }

    /**
     * Called every frame by the engine
     * @param {number} dt - delta time in seconds
     */
    update(dt) {
        const s = this.state;

        // Handle transition timer
        if (s.isTransitioning) {
            s.transitionTime += dt * 1000;
            if (s.transitionTime >= s.transitionDuration && s.transitionCallback) {
                s.transitionCallback();
                s.transitionCallback = null;
            }
            return;
        }

        // AI move timer
        if (s.gameState === TIC_STATES.PLAYING && s.aiThinking) {
            this._aiTimer += dt * 1000;
            if (this._aiTimer >= s.aiMoveDelay) {
                this._executeAIMove();
            }
        }

        // Auto-advance to result after a brief delay
        if (s.gameState === TIC_STATES.PLAYING && (s.winner || s.isDraw)) {
            this._resultDelay += dt * 1000;
            if (this._resultDelay >= 1800) { // 1.8s to admire the win animation
                this._enterResult();
            }
        }

        // Animate cell placements
        for (const idx in s.cellAnimations) {
            s.cellAnimations[idx].time += dt;
        }

        // Result screen animation
        if (s.gameState === TIC_STATES.RESULT) {
            s.resultAnimTime += dt;
        }
    }

    /**
     * Called every frame for rendering (no-op since we use DOM)
     */
    render(dt) {
        // DOM-based rendering — UI updates are event-driven, not per-frame
        // Only update AI thinking visibility if in playing state
        if (this.state.gameState === TIC_STATES.PLAYING) {
            this.ui.showAIThinking(this.state.aiThinking);
            this.ui._updateTurnDisplay();
        }
    }

    /**
     * Called every frame for input (handled via event listeners instead)
     */
    handleInput(dt) {
        // Input is handled via DOM event listeners for better responsiveness
    }

    // ════════════════════════════════════════════
    //  GAME FLOW
    // ════════════════════════════════════════════

    _enterMenu() {
        this.state.changeGameState(TIC_STATES.MENU);
        this.state.menuScreen = MENU_SCREENS.MODE_SELECT;
        this.state.menuSelectedIndex = 0;

        this.ui.triggerGlitch();
        this.ui.renderModeSelect();
        this._bindMenuEvents();

        this._playSound('navigate');
    }

    _enterDifficultySelect() {
        this.state.menuScreen = MENU_SCREENS.DIFFICULTY_SELECT;
        this.state.menuSelectedIndex = 1; // Default to Medium

        this.ui.triggerGlitch();
        this.ui.renderDifficultySelect();
        this._bindMenuEvents();

        this._playSound('navigate');
    }

    _startGame() {
        this.state.resetBoard();
        this.state.changeGameState(TIC_STATES.PLAYING);

        this._aiTimer = 0;
        this._resultDelay = 0;

        this.ui.triggerGlitch();
        this.ui.renderGameBoard();
        this._bindGameEvents();

        this._playSound('start');
    }

    _enterResult() {
        const s = this.state;

        // Update scores
        if (s.winner) {
            s.scores[s.winner.player]++;
        } else {
            s.scores.draws++;
        }

        s.changeGameState(TIC_STATES.RESULT);
        s.menuSelectedIndex = 0;

        this.ui.stopParticles();
        this.ui.triggerGlitch();
        this.ui.renderResult();
        this._bindResultEvents();

        this._playSound(s.winner ? 'win' : 'draw');
    }

    _restartGame() {
        this._unbindGameEvents();
        this.ui.stopParticles();
        this._startGame();
    }

    _backToLobby() {
        this._playSound('navigate');
        if (this.gsm) {
            this.gsm.backToLobby();
        } else {
            const event = new CustomEvent('backToLobbyFromGame');
            document.dispatchEvent(event);
        }
    }

    // ════════════════════════════════════════════
    //  MOVE LOGIC
    // ════════════════════════════════════════════

    _makeMove(cellIndex) {
        const s = this.state;
        if (s.gameState !== TIC_STATES.PLAYING) return;
        if (s.winner || s.isDraw) return;
        if (s.aiThinking) return;
        if (s.board[cellIndex] !== '') return;

        // Place symbol
        const placed = s.placeSymbol(cellIndex);
        if (!placed) return;

        // Update cell in DOM
        this.ui._updateBoardCells();
        this._playSound('click');

        // Check win
        const winResult = s.checkWin();
        if (winResult) {
            s.winner = winResult;
            this.ui._updateBoardCells(); // highlight win cells
            this.ui.drawWinLine(winResult.cells);
            this._resultDelay = 0;
            return;
        }

        // Check draw
        if (s.checkDraw()) {
            s.isDraw = true;
            this._resultDelay = 0;
            return;
        }

        // Switch turn
        s.switchPlayer();
        this.ui._updateTurnDisplay();

        // Trigger AI if it's AI's turn
        if (s.isAITurn()) {
            s.aiThinking = true;
            this._aiTimer = 0;
            this.ui.showAIThinking(true);
        }
    }

    _executeAIMove() {
        const s = this.state;
        const aiMove = TicTacToeAI.getMove([...s.board], s.mode, 'O');

        s.aiThinking = false;
        this._aiTimer = 0;
        this.ui.showAIThinking(false);

        if (aiMove >= 0) {
            this._makeMove(aiMove);
        }
    }

    // ════════════════════════════════════════════
    //  EVENT BINDING
    // ════════════════════════════════════════════

    _bindMenuEvents() {
        this._unbindMenuEvents();

        // Click on menu options
        const options = document.querySelectorAll('.tic-menu-option');
        options.forEach(opt => {
            opt.addEventListener('click', this._onMenuOptionClick);
        });

        // Back button
        const backBtn = document.getElementById('tic-back-btn');
        if (backBtn) backBtn.addEventListener('click', this._onBackBtn);
    }

    _unbindMenuEvents() {
        const options = document.querySelectorAll('.tic-menu-option');
        options.forEach(opt => {
            opt.removeEventListener('click', this._onMenuOptionClick);
        });
        const backBtn = document.getElementById('tic-back-btn');
        if (backBtn) backBtn.removeEventListener('click', this._onBackBtn);
    }

    _bindGameEvents() {
        this._unbindGameEvents();

        // Cell clicks
        const cells = document.querySelectorAll('.tic-cell');
        cells.forEach(cell => {
            cell.addEventListener('click', this._onCellClick);
            cell.addEventListener('mouseenter', (e) => {
                const idx = parseInt(e.currentTarget.dataset.cell);
                this.ui.hoverCell = idx;
                this.ui._updateBoardCells();
            });
            cell.addEventListener('mouseleave', () => {
                this.ui.hoverCell = -1;
                this.ui._updateBoardCells();
            });
        });

        // Back button
        const backBtn = document.getElementById('tic-back-btn');
        if (backBtn) backBtn.addEventListener('click', this._onBackBtn);

        // Restart button
        const restartBtn = document.getElementById('tic-restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', this._onRestartBtn);
    }

    _unbindGameEvents() {
        const cells = document.querySelectorAll('.tic-cell');
        cells.forEach(cell => {
            cell.removeEventListener('click', this._onCellClick);
        });
        const backBtn = document.getElementById('tic-back-btn');
        if (backBtn) backBtn.removeEventListener('click', this._onBackBtn);
        const restartBtn = document.getElementById('tic-restart-btn');
        if (restartBtn) restartBtn.removeEventListener('click', this._onRestartBtn);
    }

    _bindResultEvents() {
        this._unbindResultEvents();

        const playAgainBtn = document.getElementById('tic-play-again-btn');
        const changeModeBtn = document.getElementById('tic-change-mode-btn');
        const backLobbyBtn = document.getElementById('tic-back-lobby-btn');
        const backBtn = document.getElementById('tic-back-btn');

        if (playAgainBtn) playAgainBtn.addEventListener('click', this._onPlayAgainBtn);
        if (changeModeBtn) changeModeBtn.addEventListener('click', this._onChangeModeBtn);
        if (backLobbyBtn) backLobbyBtn.addEventListener('click', this._onBackLobbyBtn);
        if (backBtn) backBtn.addEventListener('click', this._onBackBtn);
    }

    _unbindResultEvents() {
        const playAgainBtn = document.getElementById('tic-play-again-btn');
        const changeModeBtn = document.getElementById('tic-change-mode-btn');
        const backLobbyBtn = document.getElementById('tic-back-lobby-btn');

        if (playAgainBtn) playAgainBtn.removeEventListener('click', this._onPlayAgainBtn);
        if (changeModeBtn) changeModeBtn.removeEventListener('click', this._onChangeModeBtn);
        if (backLobbyBtn) backLobbyBtn.removeEventListener('click', this._onBackLobbyBtn);
    }

    // ════════════════════════════════════════════
    //  EVENT HANDLERS
    // ════════════════════════════════════════════

    _onCellClick(e) {
        const cellIndex = parseInt(e.currentTarget.dataset.cell);
        if (!isNaN(cellIndex)) {
            this.state.usingKeyboard = false;
            this._makeMove(cellIndex);
        }
    }

    _onBackBtn() {
        const s = this.state;
        this._playSound('navigate');

        if (s.gameState === TIC_STATES.MENU) {
            if (s.menuScreen === MENU_SCREENS.DIFFICULTY_SELECT) {
                // Go back to mode select
                this._enterMenu();
            } else {
                // Back to lobby
                this._backToLobby();
            }
        } else if (s.gameState === TIC_STATES.PLAYING) {
            // Confirm back? For now just go to menu
            this._enterMenu();
        } else if (s.gameState === TIC_STATES.RESULT) {
            this._enterMenu();
        }
    }

    _onRestartBtn() {
        this._playSound('navigate');
        this._restartGame();
    }

    _onPlayAgainBtn() {
        this._playSound('start');
        this._restartGame();
    }

    _onChangeModeBtn() {
        this._playSound('navigate');
        this.ui.stopParticles();
        this._enterMenu();
    }

    _onBackLobbyBtn() {
        this.ui.stopParticles();
        this._backToLobby();
    }

    _onMenuOptionClick(e) {
        const option = e.currentTarget;
        const index = parseInt(option.dataset.index);
        const mode = option.dataset.mode;

        this._playSound('select');
        this.state.menuSelectedIndex = index;
        this.ui.updateMenuSelection(index);

        // Small delay for visual feedback before transitioning
        setTimeout(() => {
            this._selectMenuOption(mode);
        }, 150);
    }

    // ── KEYBOARD HANDLER ──
    _onKeyDown(e) {
        const s = this.state;
        const now = Date.now();

        // Debounce
        if (now - this._lastInputTime < this._inputCooldown) return;
        this._lastInputTime = now;

        switch (s.gameState) {
            case TIC_STATES.MENU:
                this._handleMenuKeyboard(e);
                break;
            case TIC_STATES.PLAYING:
                this._handleGameKeyboard(e);
                break;
            case TIC_STATES.RESULT:
                this._handleResultKeyboard(e);
                break;
        }
    }

    _handleMenuKeyboard(e) {
        const s = this.state;
        const optCount = s.menuOptions.length;

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex - 1 + optCount) % optCount;
                this.ui.updateMenuSelection(s.menuSelectedIndex);
                this._playSound('navigate');
                break;

            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex + 1) % optCount;
                this.ui.updateMenuSelection(s.menuSelectedIndex);
                this._playSound('navigate');
                break;

            case 'Enter':
            case 'Space':
                e.preventDefault();
                this._playSound('select');
                const selectedOpt = s.menuOptions[s.menuSelectedIndex];
                if (selectedOpt) {
                    this._selectMenuOption(selectedOpt.id);
                }
                break;

            case 'Escape':
            case 'Backspace':
                e.preventDefault();
                this._onBackBtn();
                break;
        }
    }

    _handleGameKeyboard(e) {
        const s = this.state;

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                s.usingKeyboard = true;
                s.cursorCell = (s.cursorCell - 3 + 9) % 9;
                this.ui._updateBoardCells();
                this._playSound('navigate');
                break;

            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                s.usingKeyboard = true;
                s.cursorCell = (s.cursorCell + 3) % 9;
                this.ui._updateBoardCells();
                this._playSound('navigate');
                break;

            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                s.usingKeyboard = true;
                s.cursorCell = (s.cursorCell - 1 + 9) % 9;
                this.ui._updateBoardCells();
                this._playSound('navigate');
                break;

            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                s.usingKeyboard = true;
                s.cursorCell = (s.cursorCell + 1) % 9;
                this.ui._updateBoardCells();
                this._playSound('navigate');
                break;

            case 'Enter':
            case 'Space':
                e.preventDefault();
                if (s.usingKeyboard && s.cursorCell >= 0) {
                    this._makeMove(s.cursorCell);
                }
                break;

            case 'KeyR':
                e.preventDefault();
                this._restartGame();
                break;

            case 'Escape':
            case 'Backspace':
                e.preventDefault();
                this._onBackBtn();
                break;
        }
    }

    _handleResultKeyboard(e) {
        const s = this.state;
        const btnCount = 3; // Play Again, Change Mode, Back to Lobby

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex - 1 + btnCount) % btnCount;
                this._updateResultSelection();
                this._playSound('navigate');
                break;

            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex + 1) % btnCount;
                this._updateResultSelection();
                this._playSound('navigate');
                break;

            case 'Enter':
            case 'Space':
                e.preventDefault();
                this._playSound('select');
                switch (s.menuSelectedIndex) {
                    case 0: this._onPlayAgainBtn(); break;
                    case 1: this._onChangeModeBtn(); break;
                    case 2: this._onBackLobbyBtn(); break;
                }
                break;

            case 'Escape':
            case 'Backspace':
                e.preventDefault();
                this._onBackBtn();
                break;
        }
    }

    _updateResultSelection() {
        const buttons = document.querySelectorAll('.tic-result-btn');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('selected', i === this.state.menuSelectedIndex);
        });
    }

    // ════════════════════════════════════════════
    //  MENU SELECTION LOGIC
    // ════════════════════════════════════════════

    _selectMenuOption(modeId) {
        switch (modeId) {
            case 'single':
                this.state.mode = TIC_MODES.SINGLE;
                this._startGame();
                break;

            case 'ai':
                this._enterDifficultySelect();
                break;

            case 'multi':
                this.state.mode = TIC_MODES.MULTI;
                this._startGame();
                break;

            case 'ai-easy':
                this.state.mode = TIC_MODES.AI_EASY;
                this._startGame();
                break;

            case 'ai-medium':
                this.state.mode = TIC_MODES.AI_MEDIUM;
                this._startGame();
                break;

            case 'ai-hard':
                this.state.mode = TIC_MODES.AI_HARD;
                this._startGame();
                break;
        }
    }

    // ════════════════════════════════════════════
    //  AUDIO INTEGRATION
    // ════════════════════════════════════════════

    _playSound(type) {
        if (!this.audio) return;

        switch (type) {
            case 'click':
                this.audio.playButtonSound();
                break;
            case 'navigate':
                this.audio.playNavigateSound();
                break;
            case 'select':
                this.audio.playSelectSound();
                break;
            case 'start':
                this.audio.playStartSound();
                break;
            case 'win':
                this._playWinSound();
                break;
            case 'draw':
                this._playDrawSound();
                break;
        }
    }

    _playWinSound() {
        if (!this.audio || !this.audio.audioContext) return;
        const ctx = this.audio.audioContext;
        const vol = this.audio.volume;

        // Ascending victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
            osc.type = 'square';
            gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.3);
        });
    }

    _playDrawSound() {
        if (!this.audio || !this.audio.audioContext) return;
        const ctx = this.audio.audioContext;
        const vol = this.audio.volume;

        // Flat descending tone
        const notes = [440, 392, 349.23]; // A4, G4, F4
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.25);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.25);
        });
    }

    // ════════════════════════════════════════════
    //  PUBLIC API
    // ════════════════════════════════════════════

    getGameState() {
        return this.state.getSnapshot();
    }
}

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TicTacToeGame };
}