// ═══════════════════════════════════════════════════════════════════
// ARCADE X — SNAKE GAME CONTROLLER
// Orchestrates State + AI + UI + Audio.
// Scene interface: init(), destroy(), update(dt), render(dt)
// NO FRAMEWORKS. NO LIBRARIES. PURE VANILLA JS.
// ═══════════════════════════════════════════════════════════════════

class SnakeGame extends BaseGame {
    constructor(gameSceneManager) {
        super(gameSceneManager);

        // ── Subsystems ──
        this.state = new SnakeState();
        this.ui = new SnakeUI(this.state, this.audio);

        // ── DOM ──
        this.container = null;

        // ── Timers ──
        this._resultDelay = 0;
        this._gameOverTriggered = false;

        // ── Input ──
        this._lastInputTime = 0;
        this._inputCooldown = 80; // ms

        // ── Touch ──
        this._touchStartX = 0;
        this._touchStartY = 0;

    // ── Bound methods ──
    this._onKeyDown       = this._onKeyDown.bind(this);
    this._onBackBtn       = this._onBackBtn.bind(this);
    this._onRestartBtn    = this._onRestartBtn.bind(this);
    this._onPauseBtn      = this._onPauseBtn.bind(this);
    this._onPlayAgainBtn  = this._onPlayAgainBtn.bind(this);
    this._onChangeModeBtn = this._onChangeModeBtn.bind(this);
    this._onBackLobbyBtn  = this._onBackLobbyBtn.bind(this);
    this._onMenuOptionClick = this._onMenuOptionClick.bind(this);
    this._onTouchStart    = this._onTouchStart.bind(this);
    this._onTouchEnd      = this._onTouchEnd.bind(this);
    this._onResize        = this._onResize.bind(this);
    
    // Sound helper
    this._playSound = this._playSound.bind(this);
    }

    // ════════════════════════════════════════════
    //  SCENE INTERFACE
    // ════════════════════════════════════════════

    init(data) {
        this.container = document.getElementById('game-scene');
        if (!this.container) { console.error('Snake: #game-scene not found'); return; }

        this.container.innerHTML = '';
        this.container.style.display = 'block';

        // Mount UI shell
        this.ui.mount(this.container);

        // Wire events
        document.addEventListener('keydown', this._onKeyDown);
        this.container.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.container.addEventListener('touchend', this._onTouchEnd, { passive: false });
        window.addEventListener('resize', this._onResize);

        // State events
        this.state.on('eat', () => this._playSound('move'));
        this.state.on('gameOver', () => {
            this._gameOverTriggered = true;
            this._resultDelay = 0;
            this._playSound('lose');
        });

        // Direct mode launch or menu
        if (typeof data === 'string' && data !== 'single') {
            this.state.mode = data;
            this._startGame();
        } else {
            this._enterMenu();
        }

        console.log('SNAKE: Scene initialized');
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeyDown);
        this.container?.removeEventListener('touchstart', this._onTouchStart);
        this.container?.removeEventListener('touchend', this._onTouchEnd);
        window.removeEventListener('resize', this._onResize);
        this.ui.destroy();
        this.state.destroy();
        console.log('SNAKE: Scene destroyed');
    }

    update(dt) {
        const s = this.state;

        // ── Transitions ──
        if (s.isTransitioning) {
            s.transitionTime += dt * 1000;
            if (s.transitionTime >= s.transitionDuration && s.transitionCallback) {
                s.transitionCallback();
                s.transitionCallback = null;
            }
            return;
        }

        if (s.gameState !== SNAKE_STATES.PLAYING) return;

        // ── Timers ──
        s.foodAge += dt;
        if (s.eatFlash > 0) s.eatFlash = Math.max(0, s.eatFlash - dt);
        if (s.deathEffect > 0) s.deathEffect = Math.max(0, s.deathEffect - dt);

        // ── Game over delay → result screen ──
        if (this._gameOverTriggered) {
            s.deathEffect = 0.5;
            this._resultDelay += dt * 1000;
            if (this._resultDelay >= 1200) {
                this._enterResult();
                this._gameOverTriggered = false;
            }
            return;
        }

        // ── AI moves (before tick) ──
        if (s.isAIMode()) {
            const ai = s.snakes[1];
            if (ai && ai.alive) {
                const dir = SnakeAI.getMove(ai, s.food, s, s.mode);
                ai.queueDirection(dir);
            }
        }

        // ── Tick accumulator ──
        s.tickTimer += dt * 1000;
        if (s.tickTimer >= s.tickInterval) {
            s.tickTimer -= s.tickInterval;
            const result = s.tick();

            if (result === 'continue') {
                this.ui.updateHUD();
            }
        }
    }

    render(dt) {
        if (this.state.gameState === SNAKE_STATES.PLAYING ||
            (this.state.gameState === SNAKE_STATES.PAUSED)) {
            this.ui.drawFrame();
        }
    }

    handleInput(dt) { /* handled via event listeners */ }
    
    getRenderMode() {
        return "canvas";
    }

    // ════════════════════════════════════════════
    //  GAME FLOW
    // ════════════════════════════════════════════

    _enterMenu() {
        this.state.changeGameState(SNAKE_STATES.MENU);
        this.state.menuScreen = SNAKE_MENU_SCREENS.MODE_SELECT;
        this.state.menuSelectedIndex = 0;

        this.ui.triggerGlitch();
        this.ui.renderModeSelect();
        this._bindMenuEvents();
        this._playSound('navigate');
    }

    _enterDifficultySelect() {
        this.state.menuScreen = SNAKE_MENU_SCREENS.DIFFICULTY_SELECT;
        this.state.menuSelectedIndex = 1;

        this.ui.triggerGlitch();
        this.ui.renderDifficultySelect();
        this._bindMenuEvents();
        this._playSound('navigate');
    }

    _startGame() {
        this.state.initGame();
        this.state.changeGameState(SNAKE_STATES.PLAYING);
        this._gameOverTriggered = false;
        this._resultDelay = 0;

        this.ui.triggerGlitch();
        this.ui.renderGameBoard();
        this._bindGameEvents();
        this._playSound('start');

        // Resize canvas to fit
        requestAnimationFrame(() => this.ui._sizeCanvas());
    }

    _enterResult() {
        const s = this.state;

        // Update high score (single player)
        if (s.snakes.length === 1) {
            if (s.snakes[0].score > s.highScore) {
                s.highScore = s.snakes[0].score;
            }
        }

        s.changeGameState(SNAKE_STATES.RESULT);
        s.menuSelectedIndex = 0;

        this.ui._stopParticles();
        this.ui.triggerGlitch();
        this.ui.renderResult();
        this._bindResultEvents();

        this._playSound(s.winner?.id === 0 ? 'win' : 'gameOver');
    }

    _togglePause() {
        const s = this.state;
        if (s.gameState === SNAKE_STATES.PLAYING) {
            s.changeGameState(SNAKE_STATES.PAUSED);
            this.ui.renderPauseOverlay();
            this._playSound('navigate');
        } else if (s.gameState === SNAKE_STATES.PAUSED) {
            s.changeGameState(SNAKE_STATES.PLAYING);
            this.ui._removePauseOverlay();
            this._playSound('select');
        }
    }

    _restartGame() {
        this.ui._stopParticles();
        this._startGame();
    }

    _backToLobby() {
        this._playSound('navigate');
        if (this.gsm) {
            this.gsm.backToLobby();
        } else {
            document.dispatchEvent(new CustomEvent('backToLobbyFromGame'));
        }
    }

    // ════════════════════════════════════════════
    //  EVENT BINDING
    // ════════════════════════════════════════════

    _bindMenuEvents() {
        this._unbindAll();
        document.querySelectorAll('.snk-menu-option').forEach(o => o.addEventListener('click', this._onMenuOptionClick));
        const back = document.getElementById('snk-back-btn');
        if (back) back.addEventListener('click', this._onBackBtn);
    }

    _bindGameEvents() {
        this._unbindAll();
        const back = document.getElementById('snk-back-btn');
        const restart = document.getElementById('snk-restart-btn');
        const pause = document.getElementById('snk-pause-btn');
        if (back) back.addEventListener('click', this._onBackBtn);
        if (restart) restart.addEventListener('click', this._onRestartBtn);
        if (pause) pause.addEventListener('click', this._onPauseBtn);
    }

    _bindResultEvents() {
        this._unbindAll();
        const pa = document.getElementById('snk-play-again-btn');
        const cm = document.getElementById('snk-change-mode-btn');
        const bl = document.getElementById('snk-back-lobby-btn');
        const back = document.getElementById('snk-back-btn');
        if (pa) pa.addEventListener('click', this._onPlayAgainBtn);
        if (cm) cm.addEventListener('click', this._onChangeModeBtn);
        if (bl) bl.addEventListener('click', this._onBackLobbyBtn);
        if (back) back.addEventListener('click', this._onBackBtn);
    }

    _unbindAll() {
        document.querySelectorAll('.snk-menu-option').forEach(o => o.removeEventListener('click', this._onMenuOptionClick));
        ['snk-back-btn','snk-restart-btn','snk-pause-btn','snk-play-again-btn','snk-change-mode-btn','snk-back-lobby-btn']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.replaceWith(el.cloneNode(true)); // cheap unbind
            });
    }

    // ════════════════════════════════════════════
    //  EVENT HANDLERS
    // ════════════════════════════════════════════

    _onBackBtn() {
        const s = this.state;
        this._playSound('navigate');
        if (s.gameState === SNAKE_STATES.MENU) {
            if (s.menuScreen === SNAKE_MENU_SCREENS.DIFFICULTY_SELECT) {
                this._enterMenu();
            } else {
                this._backToLobby();
            }
        } else if (s.gameState === SNAKE_STATES.PLAYING || s.gameState === SNAKE_STATES.PAUSED) {
            this._enterMenu();
        } else if (s.gameState === SNAKE_STATES.RESULT) {
            this._enterMenu();
        }
    }

    _onRestartBtn()    { this._playSound('navigate'); this._restartGame(); }
    _onPauseBtn()      { this._togglePause(); }
    _onPlayAgainBtn()  { this._playSound('start'); this._restartGame(); }
    _onChangeModeBtn() { this._playSound('navigate'); this.ui._stopParticles(); this._enterMenu(); }
    _onBackLobbyBtn()  { this.ui._stopParticles(); this._backToLobby(); }

    _onMenuOptionClick(e) {
        const opt = e.currentTarget;
        const index = parseInt(opt.dataset.index);
        const mode = opt.dataset.mode;
        this._playSound('select');
        this.state.menuSelectedIndex = index;
        this.ui.updateMenuSelection(index);
        setTimeout(() => this._selectMenuOption(mode), 150);
    }

    _onResize() {
        if (this.state.gameState === SNAKE_STATES.PLAYING || this.state.gameState === SNAKE_STATES.PAUSED) {
            this.ui._sizeCanvas();
        }
    }

    // ── KEYBOARD ──
    _onKeyDown(e) {
        const s = this.state;

        switch (s.gameState) {
            case SNAKE_STATES.MENU:   this._handleMenuKey(e); break;
            case SNAKE_STATES.PLAYING: this._handleGameKey(e); break;
            case SNAKE_STATES.PAUSED:  this._handlePausedKey(e); break;
            case SNAKE_STATES.RESULT:  this._handleResultKey(e); break;
        }
    }

    _handleMenuKey(e) {
        const s = this.state;
        const n = s.menuOptions.length;
        switch (e.code) {
            case 'ArrowUp': case 'KeyW':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex - 1 + n) % n;
                this.ui.updateMenuSelection(s.menuSelectedIndex);
                this._playSound('navigate');
                break;
            case 'ArrowDown': case 'KeyS':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex + 1) % n;
                this.ui.updateMenuSelection(s.menuSelectedIndex);
                this._playSound('navigate');
                break;
            case 'Enter': case 'Space':
                e.preventDefault();
                this._playSound('select');
                const opt = s.menuOptions[s.menuSelectedIndex];
                if (opt) this._selectMenuOption(opt.id);
                break;
            case 'Escape': case 'Backspace':
                e.preventDefault();
                this._onBackBtn();
                break;
        }
    }

    _handleGameKey(e) {
        const s = this.state;
        if (this._gameOverTriggered) return;

        // Player 1 — Arrow keys
        const p1 = s.snakes[0];
        switch (e.code) {
            case 'ArrowUp':    e.preventDefault(); if (p1) p1.queueDirection('UP');    break;
            case 'ArrowDown':  e.preventDefault(); if (p1) p1.queueDirection('DOWN');  break;
            case 'ArrowLeft':  e.preventDefault(); if (p1) p1.queueDirection('LEFT');  break;
            case 'ArrowRight': e.preventDefault(); if (p1) p1.queueDirection('RIGHT'); break;
        }

        // Player 2 — WASD (multiplayer only)
        if (s.mode === SNAKE_MODES.MULTI) {
            const p2 = s.snakes[1];
            switch (e.code) {
                case 'KeyW': e.preventDefault(); if (p2) p2.queueDirection('UP');    break;
                case 'KeyS': e.preventDefault(); if (p2) p2.queueDirection('DOWN');  break;
                case 'KeyA': e.preventDefault(); if (p2) p2.queueDirection('LEFT');  break;
                case 'KeyD': e.preventDefault(); if (p2) p2.queueDirection('RIGHT'); break;
            }
        }

        // Global
        switch (e.code) {
            case 'KeyP':   e.preventDefault(); this._togglePause(); break;
            case 'KeyR':   e.preventDefault(); this._restartGame(); break;
            case 'Escape': e.preventDefault(); this._onBackBtn();   break;
        }
    }

    _handlePausedKey(e) {
        switch (e.code) {
            case 'KeyP': case 'Enter': case 'Space':
                e.preventDefault();
                this._togglePause();
                break;
            case 'Escape':
                e.preventDefault();
                this._onBackBtn();
                break;
        }
    }

    _handleResultKey(e) {
        const s = this.state;
        const n = 3;
        switch (e.code) {
            case 'ArrowUp': case 'KeyW':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex - 1 + n) % n;
                this._updateResultSelection();
                this._playSound('navigate');
                break;
            case 'ArrowDown': case 'KeyS':
                e.preventDefault();
                s.menuSelectedIndex = (s.menuSelectedIndex + 1) % n;
                this._updateResultSelection();
                this._playSound('navigate');
                break;
            case 'Enter': case 'Space':
                e.preventDefault();
                this._playSound('select');
                switch (s.menuSelectedIndex) {
                    case 0: this._onPlayAgainBtn(); break;
                    case 1: this._onChangeModeBtn(); break;
                    case 2: this._onBackLobbyBtn(); break;
                }
                break;
            case 'Escape':
                e.preventDefault();
                this._onBackBtn();
                break;
        }
    }

    _updateResultSelection() {
        const btns = document.querySelectorAll('.snk-result-btn');
        btns.forEach((b, i) => b.classList.toggle('selected', i === this.state.menuSelectedIndex));
    }

    // ── TOUCH / SWIPE ──
    _onTouchStart(e) {
        if (this.state.gameState !== SNAKE_STATES.PLAYING) return;
        const t = e.touches[0];
        this._touchStartX = t.clientX;
        this._touchStartY = t.clientY;
        e.preventDefault();
    }

    _onTouchEnd(e) {
        if (this.state.gameState !== SNAKE_STATES.PLAYING) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - this._touchStartX;
        const dy = t.clientY - this._touchStartY;

        const minSwipe = 30;
        if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

        const p1 = this.state.snakes[0];
        if (!p1) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            p1.queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            p1.queueDirection(dy > 0 ? 'DOWN' : 'UP');
        }
    }

    // ════════════════════════════════════════════
    //  MENU SELECTION
    // ════════════════════════════════════════════

    _selectMenuOption(modeId) {
        switch (modeId) {
            case 'single':
                this.state.mode = SNAKE_MODES.SINGLE;
                this._startGame();
                break;
            case 'ai':
                this._enterDifficultySelect();
                break;
            case 'multi':
                this.state.mode = SNAKE_MODES.MULTI;
                this._startGame();
                break;
            case 'ai-easy':
                this.state.mode = SNAKE_MODES.AI_EASY;
                this._startGame();
                break;
            case 'ai-medium':
                this.state.mode = SNAKE_MODES.AI_MEDIUM;
                this._startGame();
                break;
            case 'ai-hard':
                this.state.mode = SNAKE_MODES.AI_HARD;
                this._startGame();
                break;
        }
    }

    // ════════════════════════════════════════════
    //  AUDIO
    // ════════════════════════════════════════════

    _playSound(type) {
        if (!this.audio) return;
        // Use central AudioManager
        switch (type) {
            case 'navigate': this.audio.play('navigate'); break;
            case 'select':   this.audio.play('select');   break;
            case 'start':    this.audio.play('start');    break;
            case 'eat':      this.audio.play('move');     break;
            case 'death':    this.audio.play('lose');     break;
            case 'win':      this.audio.play('win');      break;
            case 'gameOver': this.audio.play('lose');     break;
        }
    }



    // ════════════════════════════════════════════
    //  PUBLIC API
    // ════════════════════════════════════════════

    getGameState() { return this.state.getSnapshot(); }
}

// Make globally available
window.SnakeGame = SnakeGame;

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnakeGame };
}
